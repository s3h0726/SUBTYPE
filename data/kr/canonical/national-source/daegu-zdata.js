(function(factory) {
    factory();
})(function() {
    var Zdata = function() {
        this.init();
    };

    var repo = {
    };

    function add(id, param) {
        if (repo[id] !== undefined) {
            console.log('Zdata.add: id(' + id + ') already exist.');
            return;
        }

        var store = $.extend({}, {
            idField: 'key',
            textField: 'value',
            data: {}
        }, param);

        repo[id] = store;
        console.log('Zdata.add: id(' + id + ')');
    }

    function get(id, param, onComplete) {
        var store = repo[id];

        if (!onComplete) {
            onComplete = $.noop;
        }

        if (store === undefined) {
            console.log('Zdata.get: id(' + id + ') does not exist.');
            onComplete(null, null);
            return;
        }

        var paramData = param.data || param;
        var key = param.key || '0';
        var items = store.data[key];

        if (items) {
            onComplete(items, store);
            return;
        }
        console.log(store.url == 'function' ? "id : " + id : "url : " + store.url)
        $.ajax({
            url: typeof store.url == 'function' ? store.url(id, param) : store.url,
            method: store.method || 'GET',
            data: paramData,
            loadingTarget: false,
            cache: false,
            dataType: 'json',
            success: function(data) {
                var items = data.body;
                store.data[key] = items;
                onComplete(items, store);
                console.log('Zdata.get: put id(' + id + ':' + key + ')');
            }
        });
    }

    function remove(id) {
        if (repo[id] === undefined) {
            console.log('Zdata.remove: id(' + id + ') does not exist.');
            return;
        }

        delete repo[id];
        console.log('Zdata.remove: id(' + id + ')');
    }

    function addItems(id, key, items) {
        var store = repo[id];

        if (store === undefined) {
            console.log('Zdata.addItems: id(' + id + ') does not exist.');
            return;
        }

        if (store.data[key] !== undefined) {
            console.log('Zdata.addItems: key(' + id + ':' + key + ') already exist.');
            return;
        }

        store.data[key] = items;
        console.log('Zdata.addItems: key(' + id + ':' + key + ')');
    }

    Zdata.fn = Zdata.prototype = {
        constructor: Zdata,

        init: function() {
            console.log('Zdata: init');
        },

        add: function(id, param) {
            add(id, param);
        },

        get: function(id, param, onComplete) {
            get(id, param, onComplete);
        },

        remove: function(id) {
            remove(id);
        },

        addItems: function(id, key, items) {
            addItems(id, key, items);
        },

        html: function(id, param, target) {
            if (!(target instanceof jQuery)) {
                target = $(target);
            }

            get(id, param, function(items, store) {
                var isSelect = target.is('select');
                var defaultText = null;

                if (isSelect) {
                    var firstOpt = $('option:eq(0)', target);
                    if (firstOpt.val() == '') {
                        defaultText = firstOpt.text();
                    }
                }

                target.empty();

                if (items === null) {
                    return;
                }

                var html = '';
                var idField = store.idField;
                var textField = store.textField;

                if (isSelect) {
                    if (defaultText != null) {
                        html += '<option value="">' + defaultText + '</option>';
                    }

                    for (var i = 0, cnt = items.length; i < cnt; i++) {
                        var item = items[i];
                        html += '<option value="' + item[idField] + '">' + item[textField] + '</option>';
                    }
                } else {
                    var type = target.data('zdataFieldType') || 'radio';
                    var name = target.data('zdataFieldName');
                    var isInline = (target.data('zdataFieldInline') || 'N') == 'Y';

                    for (var i = 0, cnt = items.length; i < cnt; i++) {
                        var item = items[i];

                        if (isInline) {
                            html += '<label class="' + type + '-inline">';
                        } else {
                            html += '<div class="checkbox"><label>';
                        }

                        html += '<input type="' + type + '" name="' + name + '" value="' + item[idField] + '">' + item[textField];

                        if (isInline) {
                            html += '</label>'
                        } else {
                            html += '</label></div>';
                        } 
                    }
                }

                target.html(html)
                        .trigger('Zdata:loaded', items);
            });
        }
    };

    window.$Zdata = new Zdata();
});

