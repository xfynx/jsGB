KEY = {
    _keys: [0xF, 0xF],
    _colidx: 0,

    LEFT: $('#LEFT').data('keycode'),
    UP: $('#UP').data('keycode'),
    RIGHT: $('#RIGHT').data('keycode'),
    DOWN: $('#DOWN').data('keycode'),
    A: $('#A').data('keycode'),
    B: $('#B').data('keycode'),
    START: $('#START').data('keycode'),
    SELECT: $('#SELECT').data('keycode'),

    buttons: function () {
        return ['LEFT', 'UP', 'RIGHT', 'DOWN', 'A', 'B', 'START', 'SELECT'];
    },

    reset: function () {
        KEY._keys = [0xF, 0xF];
        KEY._colidx = 0;
    },

    rb: function () {
        switch (KEY._colidx) {
            case 0x00:
                return 0x00;
                break;
            case 0x10:
                return KEY._keys[0];
                break;
            case 0x20:
                return KEY._keys[1];
                break;
            default:
                return 0x00;
                break;
        }
    },

    wb: function (v) {
        KEY._colidx = v & 0x30;
    },

    keydown: function (e) {
        switch (e.keyCode) {
            case KEY.RIGHT :
                KEY._keys[1] &= 0xE;
                break;
            case KEY.LEFT  :
                KEY._keys[1] &= 0xD;
                break;
            case KEY.UP    :
                KEY._keys[1] &= 0xB;
                break;
            case KEY.DOWN  :
                KEY._keys[1] &= 0x7;
                break;
            case KEY.A     :
                KEY._keys[0] &= 0xE;
                break;
            case KEY.B     :
                KEY._keys[0] &= 0xD;
                break;
            case KEY.SELECT:
                KEY._keys[0] &= 0xB;
                break;
            case KEY.START :
                KEY._keys[0] &= 0x7;
                break;
        }
    },

    keyup: function (e) {
        switch (e.keyCode) {
            case KEY.RIGHT :
                KEY._keys[1] |= 0x1;
                break;
            case KEY.LEFT  :
                KEY._keys[1] |= 0x2;
                break;
            case KEY.UP    :
                KEY._keys[1] |= 0x4;
                break;
            case KEY.DOWN  :
                KEY._keys[1] |= 0x8;
                break;
            case KEY.A     :
                KEY._keys[0] |= 0x1;
                break;
            case KEY.B     :
                KEY._keys[0] |= 0x2;
                break;
            case KEY.SELECT:
                KEY._keys[0] |= 0x4;
                break;
            case KEY.START :
                KEY._keys[0] |= 0x8;
                break;
        }
    },

    bindToButtons: function(){
        $.each(KEY.buttons(), function (index, value) {
            $('#' + value).on('mousedown', function () {
                KEY.keydown(jQuery.Event('keydown', {keyCode: $(this).data('keycode'), which: $(this).data('keycode')}));
            }).on('mouseup', function () {
                KEY.keyup(jQuery.Event('keyup', {keyCode: $(this).data('keycode'), which: $(this).data('keycode')}));
            });
        });
    }
};