/****************************************************************************
 Copyright (c) 2012 Roger Clark
 ****************************************************************************/

var TrafficControlScene = cc.Scene.extend
    (
    {
    gameLayer:null,

    onEnter:function ()
    {
        this._super();

        this.gameLayer = new TrafficControlGameLayer();

        this.gameLayer.init();
        this.addChild(this.gameLayer);

    }
});

