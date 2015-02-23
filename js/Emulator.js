var Emulator = (function () {
    return {
        init: function () {
            initializeAll();
        }
    };

    function initializeAll() {
        jsGB = {
            run_interval: 0,
            trace: '',

            frame: function () {
                var fclock = Z80._clock.m + 17556;
                var brk = getById('breakpoint').value;
                var t0 = new Date();
                do {
                    if (Z80._halt) Z80._r.m = 1;
                    else {
                        //  Z80._r.r = (Z80._r.r+1) & 127;
                        Z80._map[MMU.rb(Z80._r.pc++)]();
                        Z80._r.pc &= 65535;
                    }
                    if (Z80._r.ime && MMU._ie && MMU._if) {
                        Z80._halt = 0;
                        Z80._r.ime = 0;
                        var ifired = MMU._ie & MMU._if;
                        if (ifired & 1) {
                            MMU._if &= 0xFE;
                            Z80._ops.RST40();
                        }
                        else if (ifired & 2) {
                            MMU._if &= 0xFD;
                            Z80._ops.RST48();
                        }
                        else if (ifired & 4) {
                            MMU._if &= 0xFB;
                            Z80._ops.RST50();
                        }
                        else if (ifired & 8) {
                            MMU._if &= 0xF7;
                            Z80._ops.RST58();
                        }
                        else if (ifired & 16) {
                            MMU._if &= 0xEF;
                            Z80._ops.RST60();
                        }
                        else {
                            Z80._r.ime = 1;
                        }
                    }
                    //jsGB.dbgtrace();
                    Z80._clock.m += Z80._r.m;
                    GPU.checkline();
                    TIMER.inc();
                    if ((brk && parseInt(brk, 16) == Z80._r.pc) || Z80._stop) {
                        jsGB.pause();
                        break;
                    }
                } while (Z80._clock.m < fclock);

                var t1 = new Date();
                getById('fps').innerHTML = Math.round(10000 / (t1 - t0)) / 10;
            },

            reset: function () {
                LOG.reset();
                GPU.reset();
                MMU.reset();
                Z80.reset();
                KEY.reset();
                TIMER.reset();
                Z80._r.pc = 0x100;
                MMU._inbios = 0;
                Z80._r.sp = 0xFFFE;
                Z80._r.hl = 0x014D;
                Z80._r.c = 0x13;
                Z80._r.e = 0xD8;
                Z80._r.a = 1;
                MMU.load('/jsGB/files/'+getById('file').value);

                getById('op_reset').onclick = jsGB.reset;
                getById('op_run').onclick = jsGB.run;
                getById('op_run').innerHTML = 'Run';
                getById('op_step').onclick = jsGB.step;

                getById('tilepixels').innerHTML = '';
                var tp = document.createElement('div');
                var x;
                for (var i = 0; i < 64; i++) {
                    getById('tilepixels').appendChild(tp);
                    tp = tp.cloneNode(false);
                }
                getById('tilenum').onupdate = jsGB.dbgtile();
                getById('tileprev').onclick = function () {
                    var t = parseInt(getById('tilenum').value);
                    t--;
                    if (t < 0) t = 383;
                    getById('tilenum').value = t.toString();
                    jsGB.dbgtile();
                };
                getById('tilenext').onclick = function () {
                    var t = parseInt(getById('tilenum').value);
                    t++;
                    if (t > 383) t = 0;
                    getById('tilenum').value = t.toString();
                    jsGB.dbgtile();
                };

                jsGB.dbgupdate();
                jsGB.dbgtile();
                jsGB.trace = '';
                tabMagic.init();
                jsGB.pause();

                LOG.out('MAIN', 'Reset.');
            },

            run: function () {
                Z80._stop = 0;
                jsGB.run_interval = setInterval(jsGB.frame, 3);         // тут можно поэкспериментировать с fps
                getById('op_run').innerHTML = 'Pause';
                getById('op_run').onclick = jsGB.pause;
            },

            pause: function () {
                clearInterval(jsGB.run_interval);
                Z80._stop = 1;
                jsGB.dbgupdate();

                getById('op_run').innerHTML = 'Run';
                getById('op_run').onclick = jsGB.run;
            },

            dbgupdate: function () {
                var t = getById('reg').getElementsByTagName('td');
                var x, j, k;
                for (var i = 0; i < t.length; i++) {
                    if (t[i].className == 'reg') {
                        switch (t[i].getAttribute('rel')) {
                            case 'a':
                            case 'b':
                            case 'c':
                            case 'd':
                            case 'e':
                                eval('x=Z80._r.' + t[i].getAttribute('rel') + '.toString(16);if(x.length==1)x="0"+x;');
                                break;
                            case 'pc':
                            case 'sp':
                                eval('x=Z80._r.' + t[i].getAttribute('rel') + '.toString(16);if(x.length<4){p="";for(j=4;j>x.length;j--)p+="0";x=p+x;}');
                                break;
                            case 'hl':
                                k = (Z80._r.h << 8) + Z80._r.l;
                                x = k.toString(16);
                                if (x.length < 4) {
                                    p = "";
                                    for (j = 4; j > x.length; j--)p += "0";
                                    x = p + x;
                                }
                                break;
                            case 'f':
                                x = (Z80._r.f >> 4).toString(2);
                                if (x.length < 4) {
                                    p = "";
                                    for (j = 4; j > x.length; j--)p += "0";
                                    x = p + x;
                                }
                                break;
                        }
                        t[i].innerHTML = x;
                    }
                    else if (t[i].className == 'io') {
                        j = parseInt(t[i].getAttribute('rel'), 16);
                        x = MMU.rb(0xFF00 + j).toString(16);
                        if (typeof(x) != 'undefined') {
                            if (x.length == 1) x = '0' + x;
                            t[i].innerHTML = x;
                        }
                    }
                }
            },

            dbgtrace: function () {
                var a = Z80._r.a.toString(16);
                if (a.length == 1) a = '0' + a;
                var b = Z80._r.b.toString(16);
                if (b.length == 1) b = '0' + b;
                var c = Z80._r.c.toString(16);
                if (c.length == 1) c = '0' + c;
                var d = Z80._r.d.toString(16);
                if (d.length == 1) d = '0' + d;
                var e = Z80._r.e.toString(16);
                if (e.length == 1) e = '0' + e;
                var f = Z80._r.f.toString(16);
                if (f.length == 1) f = '0' + f;
                var h = Z80._r.h.toString(16);
                if (h.length == 1) h = '0' + h;
                var l = Z80._r.l.toString(16);
                if (l.length == 1) l = '0' + l;
                var pc = Z80._r.pc.toString(16);
                if (pc.length < 4) {
                    p = '';
                    for (i = 4; i > pc.length; i--) p += '0';
                    pc = p + pc;
                }
                var sp = Z80._r.sp.toString(16);
                if (sp.length < 4) {
                    p = '';
                    for (i = 4; i > sp.length; i--) p += '0';
                    sp = p + sp;
                }
                jsGB.trace +=
                    ("A" + a + "/B" + b + "/C" + c + "/D" + d + "/E" + e + "/F" + f + "/H" + h + "/L" + l + "/PC" + pc + "/SP" + sp + "\n");
            },

            dbgtile: function () {
                var tn = parseInt(getById('tilenum').value);
                var t = GPU._tilemap[tn];
                var c = ['#ffffff', '#c0c0c0', '#606060', '#000000'];
                var d = getById('tilepixels').getElementsByTagName('div');

                for (var y = 0; y < 8; y++)
                    for (var x = 0; x < 8; x++)
                        d[y * 8 + x].style.backgroundColor = c[t[y][x]];
            },

            step: function () {
                if (Z80._r.ime && MMU._ie && MMU._if) {
                    Z80._halt = 0;
                    Z80._r.ime = 0;
                    if ((MMU._ie & 1) && (MMU._if & 1)) {
                        MMU._if &= 0xFE;
                        Z80._ops.RST40();
                    }
                }
                else {
                    if (Z80._halt) {
                        Z80._r.m = 1;
                    }
                    else {
                        Z80._r.r = (Z80._r.r + 1) & 127;
                        Z80._map[MMU.rb(Z80._r.pc++)]();
                        Z80._r.pc &= 65535;
                    }
                }
                Z80._clock.m += Z80._r.m;
                Z80._clock.t += (Z80._r.m * 4);
                GPU.checkline();
                if (Z80._stop) {
                    jsGB.pause();
                }
                jsGB.dbgupdate();
            }
        };

        window.onload = jsGB.reset;
        window.onkeydown = KEY.keydown;
        window.onkeyup = KEY.keyup;
    }
})();