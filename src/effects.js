/**
 * @file img drag
 * @author hanbingbing
 */

define(function (require) {

    'use strict';

    var $ = require('jquery');
    var RangeSlider = require('moye/RangeSlider');
    var exports = {};

    var canvas = query('.canvas')[0];
    var content = canvas.getContext('2d');
    var originCanvasData = {};

    function query(element) {
        return $('.main ' + element);
    }

    function initImgToCanvas() {
        if (document.all) {
            window.attachEvent('onload', load);  
        }
        else {  
             window.addEventListener('load', load, false);
        }
    }

    function load() {
        var img = new Image();
        img.src = '../src/test.jpg';
        if (img.complete) {
            drawBeauty(img);
        }
        else {
            img.onload = function () {
                drawBeauty(img);
            };
            img.onerror = function () {
                alert('美女加载失败，请重试');
            };
        }
    }

    /**
     * 图片转成canvas
     *
     * @param  {Object} beauty 图片
     */
    function drawBeauty(beauty){
        var width = beauty.width;
        var height = beauty.height;

        width = width > 700 ? 700 : width;
        height = height > 600 ? 600 : height;
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        content.drawImage(beauty, 0, 0);
        effect.init();
    }

    var effect = {

        init: function () {
            this.setOriginData();
            this.initDownload();
            this.initChangeEffects();
            this.initSlider();
        },

        /**
         * 初始化下载图片
         *
         */
        initDownload: function () {
            var cv = canvas;
            query('.download').on('click', function () {
                var data = cv.toDataURL().replace("image/png", "image/octet-stream");
                window.location.href = data;
            });
        },

        initChangeEffects: function () {
            var me = this;
            $('.effects-wrap').on('click', '.effects-item', function () {
                var type = $(this).data('type');
                me.changeEffect(type);
            });
        },

        /**
         * 切换特效
         *
         * @param  {string=} type 特效类型
         * @param  {number=} percent slider百分比
         */
        changeEffect: function (type, percent) {
            var canvasData = content.getImageData(0, 0, canvas.width, canvas.height);
            for (var i = 0, wid = canvasData.width; i < wid; i++) {
                for (var j = 0, hei = canvasData.height; j < hei; j++) {
                    var idx = (i + j*canvasData.width) * 4;
                    var r = originCanvasData.data[idx + 0];
                    var g = originCanvasData.data[idx + 1];
                    var b = originCanvasData.data[idx + 2];
                    if (percent) {
                        var params = {
                            r: r,
                            g: g,
                            b: b,
                            percent: percent
                        };
                    }
                    else {
                        var params = type === 'fudiao' || type === 'mirror'
                            ? {
                                r: r,
                                g: g,
                                b: b,
                                i: i,
                                j: j
                            }
                            : {
                                r: r,
                                g: g,
                                b: b
                            };
                    }
                    var output = this[type + 'Effect'](params);
                    var key = output.key || idx;
                    canvasData.data[key + 0] = output.r; // Red channel
                    canvasData.data[key + 1] = output.g; // Green channel
                    canvasData.data[key + 2] = output.b; // Blue channel
                    canvasData.data[key + 3] = 255; // Alpha channel

                }
            }
            content.putImageData(canvasData, 0, 0);
        },

        initSlider: function () {
            var list = ['red', 'green', 'blue'];
            for (var i = 0, len = list.length; i < len; i++) {
                this.createRangeSlider(list[i]);
            }
        },

        createRangeSlider: function (name) {
            var me = this;
            var rangeSlider = new RangeSlider({
                main: $('.' + name + '-range')[0],
                value: 10,
                min: 0,
                max: 10,
                range: false,
                skin: 'dot',
                responsive: true,
                scale: {
                    stick: false,
                    values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                    format: ''
                },
                valueLabel: {
                    dragShow: true,
                    format: '值：!{v}'
                }
            });
            rangeSlider.render();
            rangeSlider.on('sliding', function (e) {
                var value = e.value;
                // moneyElement.html('¥' + value);
                me.changeEffect(name + 'Channel', e.value/10);
            });
        },

        redChannelEffect: function (params) {
            var vals = $.extend({}, params);
            vals.r = vals.r * params.percent;
            return vals;
        },

        greenChannelEffect: function (params) {
            var vals = $.extend({}, params);
            vals.g = vals.g * params.percent;
            return vals;
        },

        blueChannelEffect: function (params) {
            var vals = $.extend({}, params);
            vals.b = vals.b * params.percent;
            return vals;
        },

        /**
         * 设置初始值
         */
        setOriginData: function () {
            originCanvasData = content.getImageData(0, 0, canvas.width, canvas.height);
        },

        /**
         * 灰度特效
         *
         * @param {Object} params 参数
         * @param  {number} params.r red
         * @param  {number} params.g green
         * @param  {number} params.b blue
         * @param  {number=} params.i canvas横向数据位置
         * @param  {number=} params.j canvas纵向数据位置
         * @return {Object}
         */
        huiduEffect: function (params) {
            var newGray = .299 * params.r + .587 * params.g + .114 * params.b;
            return {
                r: newGray,
                g: newGray,
                b: newGray
            };
        },

        /**
         * 连环画特效
         *
         * @see effect#huiduEffect
         */
        lianhuanhuaEffect: function (params) {
            var R = (params.g - params.b + params.g + params.r) * params.r / 256;
            var G = (params.b - params.g + params.b + params.r) * params.r / 256;
            var B = (params.b - params.g + params.b + params.r) * params.g / 256;
            return {
                r: R,
                g: G,
                b: B
            };
        },

        /**
         * 底片特效
         *
         * @see effect#huiduEffect
         */
        dipianEffect: function (params) {
            return {
                r: 255 - params.r,
                g: 255 - params.g,
                b: 255 - params.b
            };
        },

        /**
         * 黑白特效
         *
         * @see effect#huiduEffect
         */
        heibaiEffect: function (params) {
            var ave = (params.r + params.g + params.b) / 3;
            var value = ave > 130 ? 255 : 0;
            return {
                r: value,
                g: value,
                b: value
            };
        },

        /**
         * 镜子特效
         *
         * @see effect#huiduEffect
         */
        mirrorEffect: function (params) {
            var midx = (((originCanvasData.width -1) - params.i) + params.j * originCanvasData.width) * 4;
            // canvasData.data[midx + 0] = params.r; // Red channel
            // canvasData.data[midx + 1] = params.g; // Green channel
            // canvasData.data[midx + 2] = params.b; // Blue channel
            return {
                r: params.r,
                g: params.g,
                b: params.b,
                key: midx
            };
        },

        /**
         * 浮雕特效
         *
         * @see effect#huiduEffect
         */
        fudiaoEffect: function (params) {
            var bidx = ((params.i-1) + params.j * originCanvasData.width) * 4;
            var aidx = ((params.i+1) + params.j * originCanvasData.width) * 4;
            // calculate new RGB value 
            var nr = originCanvasData.data[bidx + 0] - originCanvasData.data[aidx + 0] + 128;
            var ng = originCanvasData.data[bidx + 1] - originCanvasData.data[aidx + 1] + 128;
            var nb = originCanvasData.data[bidx + 2] - originCanvasData.data[aidx + 2] + 128;
            nr = (nr < 0) ? 0 : ((nr >255) ? 255 : nr);
            ng = (ng < 0) ? 0 : ((ng >255) ? 255 : ng);
            nb = (nb < 0) ? 0 : ((nb >255) ? 255 : nb);
            return {
                r: nr,
                g: ng,
                b: nb
            };
        }
    };

    exports.init = function () {
        initImgToCanvas();
    };

    return exports;
});

