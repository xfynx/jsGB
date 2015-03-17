jsGB = {
  run_interval: 0,
  trace: '',

  frame: function() {
    var fclock = Z80._clock.m+17556;
    var t0 = new Date();

    do {
      if(Z80._halt)
        Z80._r.m=1;
      else {
        Z80._map[MMU.rb(Z80._r.pc++)]();
        Z80._r.pc &= 65535;
      }

      if(Z80._r.ime && MMU._ie && MMU._if) {
        Z80._halt=0; Z80._r.ime=0;
        var ifired = MMU._ie & MMU._if;

        if(ifired&1) { MMU._if &= 0xFE; Z80._ops.RST40(); }
        else if(ifired&2) { MMU._if &= 0xFD; Z80._ops.RST48(); }
        else if(ifired&4) { MMU._if &= 0xFB; Z80._ops.RST50(); }
        else if(ifired&8) { MMU._if &= 0xF7; Z80._ops.RST58(); }
        else if(ifired&16) { MMU._if &= 0xEF; Z80._ops.RST60(); }
        else { Z80._r.ime = 1; }
      }

      Z80._clock.m += Z80._r.m;
      GPU.checkline();
      TIMER.inc();

      if(Z80._stop) {
        jsGB.pause();
        break;
      }
    } while(Z80._clock.m < fclock);

    var t1 = new Date();
  },

  reset: function() {
    GPU.reset();
    MMU.reset();
    Z80.reset();
    KEY.reset();
    TIMER.reset();

    Z80._r.pc = 0x100;
    Z80._r.sp = 0xFFFE;
    Z80._r.hl = 0x014D;
    Z80._r.a  = 0x01;
    Z80._r.c  = 0x13;
    Z80._r.e  = 0xD8;
    MMU._inbios=0;
    MMU.load();

    document.getElementById('op_reset').onclick=jsGB.reset;
    document.getElementById('op_run').onclick=jsGB.run;
    document.getElementById('op_run').innerHTML='Run';

    jsGB.pause();
  },

  run: function() {
    Z80._stop = 0;
    jsGB.run_interval = setInterval(jsGB.frame,1);
    document.getElementById('op_run').innerHTML = 'Pause';
    document.getElementById('op_run').onclick = jsGB.pause;
  },

  pause: function() {
    clearInterval(jsGB.run_interval);
    Z80._stop = 1;
    document.getElementById('op_run').innerHTML = 'Run';
    document.getElementById('op_run').onclick = jsGB.run;
  }
};

window.onload    = jsGB.reset;
window.onkeydown = KEY.keydown;
window.onkeyup   = KEY.keyup;

function handleFileSelect(evt) {
    var files = evt.target.files;
    
    var f = files[0];
    var fileType = f.type || 'n/a';
    var lastModifiedDate = f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a';
    document.getElementById('list').innerHTML = '<strong>' + f.name + '</strong> (' + fileType +  ') - ' + f.size + ' bytes, last modified: ' + lastModifiedDate;
    
    var reader = new FileReader();
    reader.readAsArrayBuffer(f);
    
    reader.onload = function(evt) {
        if (evt.target.readyState == FileReader.DONE) {
            var buffer = evt.target.result;
            var dataView = new DataView(buffer);
            MMU._rom = new Uint8Array (buffer);
        }
    }
}


document.getElementById('files').addEventListener('change', handleFileSelect, false);
