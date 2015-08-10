/**
 * @file img drag
 * @author hanbingbing
 */

define(function () {

    'use strict';

    var exports = {};

    // 可拖动图片项
    var columns = document.querySelectorAll('.main .img-item');
    // 当前拖动元素
    var dragEl = null;

    /**
     * 开始拖动
     *
     * @param  {[type]} e [description]
     */
    function domdrugstart(e) {
        dragEl = this;

        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", this.innerHTML);
    }

    /**
     * 开始拖动
     *
     * @param  {[type]} e [description]
     */
    function domdrugenter(e) {
        e.target.classList.add('over');
    }

    /**
     * 拖拽到
     *
     * @param  {[type]} e [description]
     */
    function domdrugover(e) {
        if (e.preventDefault) {
            e.preventDefault(); 
        }

        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    /**
     * 拖拽离开
     *
     * @param  {[type]} e [description]
     */
    function domdrugleave(e) {
        e.target.classList.remove('over'); 
    }

    /**
     * 放下
     *
     * @param  {[type]} e [description]
     */
    function domdrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (dragEl != this) {
            dragEl.innerHTML = this.innerHTML;
            this.innerHTML = e.dataTransfer.getData('text/html');
        }

        return false;
    }

    /**
     * 拖动结束
     *
     * @param  {[type]} e [description]
     */
    function domdrapend(e) {
        [].forEach.call(columns, function (column) {
            column.classList.remove('over');
        });
    }

    exports.init = function () {
        [].forEach.call(columns, function (column) {
            column.addEventListener("dragstart", domdrugstart,false);
            column.addEventListener('dragenter', domdrugenter, false);
            column.addEventListener('dragover', domdrugover, false);
            column.addEventListener('dragleave', domdrugleave, false);
            column.addEventListener('drop', domdrop, false);
            column.addEventListener('dragend', domdrapend, false);
        });
    };

    return exports;
});
