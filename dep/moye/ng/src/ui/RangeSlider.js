/**
 * @file 范围选择输入控件
 * TODO: smarty tpl
 * TODO: test case
 * TODO: 完整demo
 * @author wuhuiyao@baidu.com
 */

define(function (require) {

    var $ = require('jquery');
    var Control = require('./Control');
    var painter = require('./painter');
    var lib = require('./lib');

    /**
     * 判断给定值是否发生变化
     *
     * @private
     * @param {number|Object} oldValue 旧的值
     * @param {number|Object} newValue 新的值
     * @param {boolean} isRange 是否范围选择
     * @return {boolean}
     */
    function isValueChange(oldValue, newValue, isRange) {
        if (isRange) {
            return oldValue.from !== newValue.from || oldValue.to !== newValue.to;
        }

        return oldValue !== newValue;
    }

    /**
     * 初始化该控件的值
     *
     * @inner
     * @param {number} value 要初始化的值
     */
    function initValue(value) {
        if (this.range) {
            if (typeof value === 'object') {
                value = {
                    from: this.toValidateValue(value.from),
                    to: this.toValidateValue(value.to)
                };
            }
            else {
                value = this.toValidateValue(value);
                value = {from: value, to: value};
            }

            this.value = value;
        }
        else {
            this.value = this.toValidateValue(value);
        }
    }

    /**
     * 更新范围选择输入控件的值
     *
     * @inner
     * @param {RangeSlider} rangeSlider 范围选择控件
     * @param {number|Object} value 要更新的值
     */
    function updateControlValue(rangeSlider, value) {
        initValue.call(rangeSlider, value);

        // 更新输入隐藏域的值
        rangeSlider.inputField.val(rangeSlider.formater(rangeSlider.value));
    }

    /**
     * 判断给定两元素是否存在重叠
     *
     * @inner
     * @param {HTMLElement} elem1 要判断的元素
     * @param {HTMLElement} elem2 要判断的元素
     * @return {boolean}
     */
    function isOverlab(elem1, elem2) {
        elem1 = $(elem1);
        elem2 = $(elem2);

        var offset1 = elem1.offset();
        var offset2 = elem2.offset();

        var leftElem;
        var rightOffset;
        var leftOffset;
        var hasSameLeft = (offset1.left === offset2.left);

        if (offset1.left < offset2.left || (hasSameLeft && offset1.top < offset2.top)) {
            rightOffset = offset2;
            leftElem = elem1;
            leftOffset = offset1;
        }
        else {
            rightOffset = offset1;
            leftElem = elem2;
            leftOffset = offset2;
        }

        return (leftOffset.left + leftElem.outerWidth() >= rightOffset.left)
            && (leftOffset.top + leftElem.outerHeight() >= rightOffset.top);
    }

    /**
     * 范围选择输入控件
     *
     * @extends module:Control
     * @exports RangeSlider
     * @example
     * HTML:
     * <input type="range" min="1" max="20" step="2" name="price">
     */
    var RangeSlider = Control.extend(/** @lends module:RangeSlider.prototype */{

        /**
         * 控件类型
         *
         * @readonly
         * @type {string}
         */
        type: 'RangeSlider',

        /**
         * 控件默认选项配置
         *
         * @property {Object} options 控件选项配置
         * @property {number} options.min 范围选择输入控件最小值，默认0
         * @property {number} options.max 范围选择输入控件最大值，默认100
         * @property {number} options.step 滑块滑动选择增加/减小的步长，大于0的数，默认值为1
         * @property {number|{from: number, to: number}} options.value 滑块选择的值或区间，
         *           对于非区间情况下默认值为最小值和最大值平均值，区间情况下，默认为[min, max]
         * @property {boolean=} options.range 是否提供范围选择即提供两个滑块，默认一个
         * @property {Object=} options.scale 显示范围选择的刻度信息，默认不显示
         * @property {boolean|Array.<number>=} options.scale.stick 是否显示刻度线，默认不显示
         *           也可以指定要显示刻度线对应刻度值列表，若值为true，默认刻度线跟要显示刻度值列表一样
         * @property {Array} options.scale.values 要显示的刻度值列表
         *           可以这样：[10, 20, 30]，[10, 20, {value: 30, format: '$!{v}以上'}]
         *           value里指定的 `format` 优先级高于 `scale.format`
         * @property {string=} options.scale.format 刻度值格式化模板，可选, 默认原值显示，
         *           e.g., '$!{v}'
         * @property {Object|boolean=} options.valueLabel 滑块选择的值的标签信息，可选，默认不显示
         * @property {boolean=} options.valueLabel.dragShow 是否拖拽时候动态显示滑块当前值，
         *           默认 false
         * @property {string=} options.valueLabel.format 值标签格式化模板，可选, 默认
         *           原值显示，e.g., '$!{v}'
         * @property {function=} options.formater 自定义的值格式化方法，表单提交值使用该格式化
         *           后的值，默认区间值提交值格式为 `12-34`
         * @property {string=} options.scaleStickTpl 刻度线模板
         * @property {string=} options.scaleValueTpl 刻度值模板
         * @property {boolean=} options.responsive 是否支持响应式，默认，false
         */
        options: {
            min: 0,
            max: 100,
            step: 1,
            range: false,
            formater: function (value) {
                return this.range ? (value.from + '-' + value.to) : value;
            },
            scaleStickTpl: '<span class="!{className}" style="!{style}">!{content}</span>',
            scaleValueTpl: '<span class="!{className}" style="!{style}">!{content}</span>'
        },

        /**
         * 初始化表单控件的配置
         *
         * @override
         */
        init: function (options) {
            this.$parent(options);

            // 如果提供的 main 是输入域的，用输入域提供的属性值来作为选项一部分，如果没有传入
            // 相应选项信息的时候
            var rawMain = $(this.main);
            if (this.main.tagName === 'INPUT') {
                (options.min == null) && (this.min = +rawMain.attr('min'));
                (options.max == null) && (this.max = +rawMain.attr('max'));
                (options.step == null) && (this.step = +rawMain.attr('step'));
                (options.value == null) && (this.value = +rawMain.attr('value'));
                (options.disabled == null) && (this.disabled = rawMain.prop('disabled'));
                (options.readOnly == null) && (this.readOnly = rawMain.prop('readonly'));

                // 为了兼容所有浏览器，不管当前浏览器是否支持 range ，统一用模拟方式实现
                this.main = this.createMain();
                rawMain.after(this.main).remove();
            }

            // 初始化 最小值、最大值、步长及值信息
            var defaultOptions = this.options;
            this.min = parseFloat(this.min);
            (typeof this.min !== 'number') && (this.min = defaultOptions.min);
            this.max = parseFloat(this.max);
            (typeof this.max !== 'number') && (this.max = defaultOptions.max);

            if (this.min >= this.max) {
                throw 'illegal min and max value';
            }

            parseFloat(this.step) > 0 || (this.step = defaultOptions.step);

            // 初始化值标签信息
            var valueLabel = this.valueLabel;
            if (valueLabel && typeof valueLabel === 'boolean') {
                this.valueLabel = {dragShow: false};
            }

            // 初始化范围选择输入控件的隐藏域
            this.inputField = $('<input type="hidden">')
                .prop('name', this.name || rawMain.prop('name'))
                .prop('disabled', !!this.disabled)
                .appendTo(this.main);
        },

        /**
         * 初始化控件的宽高信息
         *
         * @private
         */
        initControlSizeInfo: function () {
            var $main = $(this.main);
            this.rangeBarHeight = $main.height();
            this.rangeBarWidth = $main.width();
            this.rangeOffset = $main.offset();
        },

        /**
         * 将给定的值转成有效值
         *
         * @param {number} value 原始值
         * @param {boolean} isFromValue 是否是起始滑块
         * @return {number}
         */
        toValidateValue: function (value, isFromValue) {
            value = parseFloat(value);

            var min = this.min;
            var max = this.max;
            if (this.range) {
                !isFromValue && (min = this.value.from);
                isFromValue && (max = this.value.to);
            }

            if (value < min) {
                return min;
            }
            else if (value > max) {
                return max;
            }

            return value;
        },

        /**
         * 设置滑块值，该方法没有同步更新该范围选择输入控件的值，
         * 要同步该值，使用 {@link module:RangeSlider#saveCursorValue}
         *
         * @private
         * @fires module:RangeSlider#sliding
         * @param {Object} cursorObj 要设置的滑块对象
         * @param {number} value 要设置的值
         */
        setCursorValue: function (cursorObj, value) {
            var me = this;
            var isStartCursor = cursorObj.isStartCursor;
            var rangeValue;

            if (me.range) {
                rangeValue = $.extend({}, me.value);
                rangeValue[isStartCursor ? 'from' : 'to'] = value;
            }
            else {
                rangeValue = value;
            }

            me.updateRangeBar(rangeValue);
            me.updateCursorPosition(cursorObj, value);

            /**
             * @event module:RangeSlider#sliding 滑块滑动事件
             * @param {Object} e 事件对象参数
             * @param {number|Object} e.value 当前滑块对应的值
             */
            this.fire('sliding', {value: rangeValue});
        },

        /**
         * 保存滑块的值
         *
         * @private
         * @fires module:RangeSlider#change
         * @param {Object} cursorObj 要保存的滑块对象
         */
        saveCursorValue: function (cursorObj) {
            var me = this;
            var value = cursorObj.value;

            var oldValue = me.value;
            var newValue;
            if (me.range) {
                newValue = $.extend({}, oldValue);
                newValue[cursorObj.isStartCursor ? 'from' : 'to'] = value;
            }
            else {
                newValue = value;
            }
            me.value = newValue;

            if (!isValueChange(oldValue, newValue, me.range)) {
                return;
            }

            /**
             * @event module:RangeSlider#change
             * @param {Object} e 事件对象参数
             * @param {number|Object} e.oldValue 旧的值
             * @param {number|Object} e.newValue 新的值
             */
            me.fire('change', {
                oldValue: oldValue,
                newValue: newValue
            });

            updateControlValue(this, newValue);
        },

        /**
         * 获取滑块值
         *
         * @private
         * @param {Object} cursorObj 要获取的滑块对象
         * @param {boolean=} isSaved 获取的值是否是为保存过的值
         * @return {number}
         */
        getCursorValue: function (cursorObj, isSaved) {
            if (isSaved) {
                var me = this;
                var value = me.value;

                if (me.range) {
                    return cursorObj.isStartCursor ? value.from : value.to;
                }

                return value;
            }

            return cursorObj.value;
        },

        /**
         * 获取滑块滑动边界值
         *
         * @private
         * @param {Object} cursorObj 滑块对象
         * @return {{min: number, max: number}}
         */
        getCursorBound: function (cursorObj) {
            if (this.range) {
                if (cursorObj.isStartCursor) {
                    return {min: this.min, max: this.toCursor.getValue()};
                }

                return {min: this.fromCursor.getValue(), max: this.max};
            }

            return {min: this.min, max: this.max};
        },

        /**
         * 创建滑块标签
         *
         * @private
         * @return {HTMLElement}
         */
        createCursorLabel: function () {
            return this.helper.createPart('cursor-label', 'span');
        },

        /**
         * 创建滑块
         *
         * @private
         * @param {boolean} isStartCursor 是否起始滑块
         * @return {{cursor: jQuery, label: ?jQuery}}
         */
        createCursor: function (isStartCursor) {
            var me = this;
            var main = me.main;
            var cursor =  $(me.helper.createPart('cursor', 'span'));
            cursor.appendTo(main);

            var cursorLabel;
            var valueLabel = me.valueLabel;
            if (valueLabel) {
                cursorLabel = $(this.createCursorLabel());
                cursorLabel[valueLabel.dragShow ? 'hide' : 'show']();
                cursorLabel.appendTo(main);
            }

            var cursorObj = {
                cursor: cursor,
                label: cursorLabel,
                isStartCursor: isStartCursor
            };
            cursorObj.getBoundValue = $.proxy(me.getCursorBound, me, cursorObj);
            cursorObj.getValue = $.proxy(me.getCursorValue, me, cursorObj);
            cursorObj.setValue = $.proxy(me.setCursorValue, me, cursorObj);
            cursorObj.saveValue = $.proxy(me.saveCursorValue, me, cursorObj);

            return cursorObj;
        },

        /**
         * 将给定的值转成百分比数
         *
         * @private
         * @param {number} value 给定的值
         * @return {string}
         */
        toPercentValue: function (value) {
            var percent = (value - this.min) / (this.max - this.min) * 100;
            return percent < 0 ? '0%' : (percent + '%');
        },

        /**
         * 将给定的像素值转成控件实际范围值
         *
         * @private
         * @param {number} pixelValue 要转换的像素值
         * @return {number}
         */
        toRangeValue: function (pixelValue) {
            return (this.max - this.min) * (pixelValue / this.rangeBarWidth);
        },

        /**
         * 创建刻度尺的刻度线部件
         *
         * @private
         * @param {jQuery} scaleWrap 刻度尺容器元素
         * @param {Array} values 刻度线对应的值列表
         */
        createScaleStick: function (scaleWrap, values) {
            var helper = this.helper;
            var html = [];

            for (var i = 0, len = values.length; i < len; i++) {
                var value = values[i];
                if (typeof value === 'object') {
                    value = value.value;
                }

                var className = '';
                if (i === 0) {
                    className = ' first';
                }
                else if (i === len - 1) {
                    className = ' last';
                }

                html[i] = lib.format(this.scaleStickTpl, {
                    className: helper.getPartClassName('scale-stick') + className,
                    style: 'left: ' + this.toPercentValue(value),
                    content: ''
                });
            }

            scaleWrap.html(html.join(''));
        },

        /**
         * 创建刻度尺的刻度值部件
         *
         * @private
         * @param {jQuery} scaleWrap 刻度尺容器元素
         * @param {Array} values 刻度值列表
         * @param {Object} scaleOption 刻度选项
         */
        createScaleValue: function (scaleWrap, values, scaleOption) {
            var helper = this.helper;
            var format = scaleOption.format;

            for (var i = 0, len = values.length; i < len; i++) {
                var value = values[i];

                if (typeof value === 'object') {
                    value.format && (format = value.format);
                    value = value.value;
                }

                var className = '';
                if (i === 0) {
                    className = ' first';
                }
                else if (i === len - 1) {
                    className = ' last';
                }

                var scaleValueElem = $(lib.format(this.scaleValueTpl, {
                    className: helper.getPartClassName('scale-value') + className,
                    style: 'left: ' + this.toPercentValue(value),
                    content: format ? lib.format(format, {v: value}) : value
                })).appendTo(scaleWrap);
                scaleValueElem.css({'margin-left': scaleValueElem.outerWidth() / -2});
            }
        },

        /**
         * 创建刻度信息
         *
         * @private
         */
        createScale: function () {
            var scaleOption = this.scale;
            if (!scaleOption) {
                return;
            }

            var scaleValues = scaleOption.values;
            var scaleWrap = $(this.helper.createPart('scale', 'div')).appendTo(this.main);
            var stick = scaleOption.stick;
            if (stick) {
                var stickValues = $.isArray(stick) ? stick : scaleValues;
                this.createScaleStick(scaleWrap, stickValues);
            }

            this.createScaleValue(scaleWrap, scaleValues, scaleOption);
        },

        /**
         * 更新滑块位置信息
         *
         * @private
         * @param {Object} cursorObj 要更新的滑块
         * @param {number} value 滑块值
         */
        updateCursorPosition: function (cursorObj, value) {
            var leftPercent = this.toPercentValue(value);
            cursorObj.cursor.css('left', leftPercent);
            cursorObj.value = value;

            var cursorLabel = cursorObj.label;
            if (cursorLabel) {
                this.updateCursorLabel(cursorLabel, value, leftPercent);
                this.combineCusorLabel();
            }
        },

        /**
         * 更新滑块标签
         *
         * @private
         * @param {jQuery} cursorLabel 滑块标签元素
         * @param {number|string} value 标签显示值
         * @param {string} leftPercent 标签距离左边的百分比
         */
        updateCursorLabel: function (cursorLabel, value, leftPercent) {
            var valueLabel = this.valueLabel;
            // lib.format 逻辑有 bug，这里转成字符串，否则如果是数字0，会输出''
            var label = valueLabel.format
                ? lib.format(valueLabel.format, {v: '' + value})
                : value;
            cursorLabel.html(label).css({
                'left': leftPercent,
                'margin-left': cursorLabel.outerWidth() / -2
            });
        },

        /**
         * 如果两个滑块标签重叠，则合并滑块标签
         *
         * @private
         */
        combineCusorLabel: function () {
            if (this.range && this.valueLabel && !this.valueLabel.dragShow) {

                var fromCursor = this.fromCursor;
                var toCursor = this.toCursor;
                var fromLabel = fromCursor.label;
                var toLabel = toCursor.label;
                var fromValue = fromCursor.value;
                var toValue = toCursor.value;

                var overlap = isOverlab(fromLabel, toLabel);
                var visibility = overlap ? 'hidden' : 'visible';
                var overflow = overlap ? 'hidden' : 'visible';
                fromLabel.css({visibility: visibility, overflow: overflow});
                toLabel.css({visibility: visibility, overflow: overflow});

                if (overlap) {

                    if (!this.overlapLabel) {
                        this.overlapLabel = $(
                            this.createCursorLabel()
                        ).appendTo(this.main);
                    }
                    this.overlapLabel.show();

                    var rangeValue = toValue - fromValue;
                    var value = rangeValue ? fromValue + '-' + toValue : fromValue;
                    var leftPercent = this.toPercentValue(fromValue + rangeValue / 2);
                    this.updateCursorLabel(this.overlapLabel, value, leftPercent);
                }
                else if (this.overlapLabel) {
                    this.overlapLabel.hide();
                }
            }
        },

        /**
         * 更新选择的区间
         *
         * @private
         * @param {number|Object} value 选择的值
         */
        updateRangeBar: function (value) {
            var interval = this.max - this.min;
            var bar = this.bar;

            if (this.range) {
                var widthPercent = (value.to - value.from) / interval * 100 + '%';
                bar.css({width: widthPercent, left: this.toPercentValue(value.from)});
            }
            else {
                bar.css({width: this.toPercentValue(value), left: 0});
            }
        },

        /**
         * 更新滑块选择值
         *
         * @private
         */
        updateSelectRange: function () {
            var value = this.value;
            var fromCursor = this.fromCursor;
            var toCursor = this.toCursor;

            this.updateRangeBar(value);
            if (this.range) {
                this.updateCursorPosition(fromCursor, value.from);
                this.updateCursorPosition(toCursor, value.to);
            }
            else {
                this.updateCursorPosition(fromCursor, value);
            }
        },

        /**
         * 初始化控件的 DOM 结构
         *
         * @override
         */
        initStructure: function () {
            var main = this.main;
            this.document = $(document);

            this.cursorFocusClassName = this.helper.getPartClassName('cursor-focus');

            // 创建滑块选择的区间条
            this.bar = $(this.helper.createPart('bar', 'span'));
            this.bar.appendTo(main);

            // 创建滑块
            this.fromCursor = this.createCursor(true);
            this.range && (this.toCursor = this.createCursor());
        },

        /**
         * 调整滑动值
         *
         * @private
         * @param {Object} cursorObj 要计算的滑块对象
         * @param {number} dragDistance 拖拽的距离，相对于开始拖拽位置
         */
        adjustCursorValue: function (cursorObj, dragDistance) {
            var dragValue = this.toRangeValue(dragDistance);
            var step = this.step;
            var temp = dragValue % step;
            var rangeValue = dragValue - temp;

            if (Math.abs(temp * 2) > step) {
                rangeValue += (temp > 0 ? step : -step);
            }

            cursorObj.setValue(this.toValidateValue(
                cursorObj.getValue(true) + rangeValue, cursorObj.isStartCursor
            ));
        },

        /**
         * 拖拽开始事件处理
         *
         * @private
         * @param {Object} e 事件对象
         */
        onCursorDragStart: function (e) {
            var target = e.currentTarget;
            var fromCursor = this.fromCursor;
            var toCursor = this.toCursor;

            // 初始化拖拽滑块，对于有多个滑块且重叠情况，得在 `move` 事件里判断拖拽的是哪个
            if (!this.range || fromCursor.getValue() !== toCursor.getValue()) {
                this.dragCursor = (fromCursor.cursor[0] === target)
                    ? fromCursor
                    : toCursor;
            }

            // 初始化拖拽开始位置
            this.dragStartPosition = e.pageX;
            this.document
                .on('mousemove', this.dragingHandler)
                .on('mouseup', this.drageEndHandler);
        },

        /**
         * 判断给定的滑块是否能移动
         *
         * @private
         * @param {Object} moveCursor 要移动的滑块对象
         * @param {number} dragDirection 拖拽方向，大于0表示往右，小于0往左
         * @return {boolean}
         */
        canMove: function (moveCursor, dragDirection) {
            var bound = moveCursor.getBoundValue();
            var startValue = moveCursor.getValue();
            if (dragDirection > 0) {
                return startValue < bound.max;
            }

            if (dragDirection < 0) {
                return startValue > bound.min;
            }

            return false;
        },

        /**
         * 获取允许拖拽的滑块对象
         *
         * @private
         * @param {number} dragDirection 拖拽方向，大于0表示往右，小于0往左
         * @return {?{cursor: jQuery, label: ?jQuery}}
         */
        getAllowDragCursor: function (dragDirection) {
            var fromCursor = this.fromCursor;
            var toCursor = this.toCursor;
            if (this.canMove(fromCursor, dragDirection)) {
                return fromCursor;
            }

            if (toCursor && this.canMove(toCursor, dragDirection)) {
                return toCursor;
            }
        },

        /**
         * 滑块移动事件处理
         *
         * @private
         * @fires module:RangeSlider#start
         * @param {Object} e 事件对象
         */
        onCursorMove: function (e) {
            e.preventDefault();

            var pageX = e.pageX;
            var currPosition = this.currDragPosition;
            (currPosition == null) && (currPosition = this.dragStartPosition);

            var dragDirection = pageX - currPosition;
            var dragCursor = this.dragCursor;
            if (!dragCursor) {
                dragCursor = this.getAllowDragCursor(dragDirection);
                dragCursor && (dragCursor.isDrag = true);
                this.dragCursor = dragCursor;
            }
            else {
                dragCursor.isDrag = true;
            }

            if (dragCursor && this.currDragPosition == null) {

                dragCursor.cursor.addClass(this.cursorFocusClassName);
                // 禁用ff下拖拽选择问题
                document.body.style.MozUserSelect = 'none';

                /**
                 * @event module:RangeSlider#start 滑动开始事件
                 */
                this.fire('start');

                if (this.valueLabel && this.valueLabel.dragShow) {
                    dragCursor.label.show();
                }
            }

            // 缓存当前拖拽位置，用于下次移动时候判断拖拽方向
            this.currDragPosition = pageX;

            if (!dragCursor || !this.canMove(dragCursor, dragDirection)) {
                return;
            }

            this.adjustCursorValue(this.dragCursor, pageX - this.dragStartPosition);
        },

        /**
         * 拖拽结束事件处理
         *
         * @private
         * @fires module:RangeSlider#end
         * @param {Object} e 事件对象
         */
        onCursorDragEnd: function (e) {
            var dragCursor = this.dragCursor;
            if (dragCursor && dragCursor.isDrag) {
                dragCursor.saveValue();

                dragCursor.cursor.removeClass(this.cursorFocusClassName);
                document.body.style.MozUserSelect = '';

                if (this.valueLabel && this.valueLabel.dragShow) {
                    dragCursor.label.hide();
                }
            }
            this.dragCursor = null;
            this.currDragPosition = null;

            /**
             * @event module:RangeSlider#end 滑动结束事件
             */
            this.fire('end');

            this.document
                .off('mousemove', this.dragingHandler)
                .off('mouseup', this.drageEndHandler);
        },

        /**
         * 绑定/移除滑块事件
         *
         * @private
         * @param {Object} cursorObj 要绑定/解绑的滑块对象
         * @param {boolean} isBind 是否绑定
         */
        toggeCursorEvents: function (cursorObj, isBind) {
            if (cursorObj) {
                var type = isBind ? 'on' : 'off';
                cursorObj.cursor[type]('mousedown', this.dragStartHandler);
            }
        },

        /**
         * 绑定/移除事件
         *
         * @private
         * @param {boolean} isBind 是否绑定
         */
        toggleEvents: function (isBind) {
            isBind = !!isBind;
            if (this.isBind === isBind) {
                return;
            }
            this.isBind = isBind;

            this.toggeCursorEvents(this.fromCursor, isBind);
            this.toggeCursorEvents(this.toCursor, isBind);

            if (!this.range) {
                var type = isBind ? 'on' : 'off';

                // 对于非多个滑块允许单击方式调整滑块位置
                $(this.main)[type]('click', this.clickRangeHandler);
            }
        },

        /**
         * 判断给定的点击位置是否在范围选择区间里
         *
         * @private
         * @param {Object} e 点击事件对象
         * @return {boolean}
         */
        isClickInRangeBar: function (e) {
            var rangeOffset = this.rangeOffset;
            var rangeX = rangeOffset.left;
            var rangeY = rangeOffset.top;
            var clickX = e.pageX;
            var clickY = e.pageY;
            var isNotIn = (clickX < rangeX)
                || (clickX > rangeX + this.rangeBarWidth)
                || (clickY < rangeY)
                || (clickY > rangeY + this.rangeBarHeight);

            return !isNotIn;
        },

        /**
         * 点击范围选择区域的事件处理
         *
         * @private
         * @param {Object} e 事件对象
         */
        onClickRange: function (e) {
            if (!this.isClickInRangeBar(e)) {
                return;
            }

            var cursorObj = this.fromCursor;
            if (cursorObj.isDrag) {
                cursorObj.isDrag = false;
                return;
            }

            e.preventDefault();

            var cursorElem = cursorObj.cursor;
            var dragDistance = e.pageX - cursorElem.offset().left - cursorElem.width() / 2;
            this.adjustCursorValue(cursorObj, dragDistance);
            cursorObj.saveValue();
        },

        /**
         * 窗口大小变化事件处理器
         *
         * @private
         */
        onResize: function () {
            this.initControlSizeInfo();
        },

        /**
         * 初始化控件的事件绑定
         *
         * @override
         */
        initEvents: function () {
            this.dragStartHandler = $.proxy(this.onCursorDragStart, this);
            this.dragingHandler = $.proxy(this.onCursorMove, this);
            this.drageEndHandler = $.proxy(this.onCursorDragEnd, this);
            this.clickRangeHandler = $.proxy(this.onClickRange, this);

            if (this.responsive) {
                this.onResizeHandler = $.proxy(this.onResize, this);
                $(window).on('resize', this.onResizeHandler);
            }

            if (!this.disabled && !this.readOnly) {
                this.toggleEvents(true);
            }
        },

        /**
         * @override
         */
        render: function () {
            this.$parent.apply(this, arguments);
            this.initControlSizeInfo();

            // 创建刻度尺
            this.createScale();
            this.updateSelectRange();
        },

        /**
         * 重渲染
         *
         * @protected
         * @override
         */
        repaint: painter.createRepaint(
            Control.prototype.repaint,
            {
                name: ['value'],
                paint: function (conf, value) {
                    this.setValue(value);
                }
            }
        ),

        /**
         * 设置范围选择输入控件的值
         *
         * @param {number|Object} value 设置的值
         */
        setValue: function (value) {
            updateControlValue(this, value);
            this.updateSelectRange();
        },

        /**
         * 获取范围选择输入控件的值
         *
         * @return {number|Object}
         */
        getValue: function () {
            return this.value;
        },

        /**
         * @override
         */
        disable: function () {
            this.$parent();
            this.toggleEvents(false);
        },

        /**
         * @override
         */
        enable: function () {
            this.$parent();
            this.toggleEvents(true);
        },

        /**
         * @override
         */
        setReadOnly: function (isReadOnly) {
            this.$parent(isReadOnly);
            this.toggleEvents(!isReadOnly);
        },

        /**
         * @override
         */
        dispose: function () {
            this.toggleEvents(false);
            if (this.responsive) {
                $(window).off('resize', this.onResizeHandler);
            }

            this.bar = this.inputField = this.document = this.fromCursor = this.toCursor = null;
            this.$parent();
        }
    });

    return RangeSlider;
});
