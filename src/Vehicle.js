/****************************************************************************
 Copyright (c) 2012 Roger Clark. www.rogerclark.net


 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

var Vehicle = cc.Sprite.extend(
 {
    _sprite:null,
     _sx:null,
     _sy:null,
     _speed:null,
     _initialSpeed:null,
     direction:null,
     lane:null,
     impeded:null,
     _stopped:null,
     windowSize:null,
     startTime:null,
     _attachMode:null,
     _attractDT:null,

    ctor:function (theDirection,theLane)
    {
        var yStart = 300;
        var xStart = 450;
        var laneWidth=52;
        var laneOffset=25;

        this._super();
        this._attachMode=false;
        this.attractDT=0;

        this.startTime = cc.Time.now();
        this._stoppedTime=null;

        this.windowSize = cc.Director.getInstance().getWinSize();

        this.direction=theDirection;// save the direction
        this.impeded=false;
        this._stopped=false;
        this.lane=theLane;

        var vehLookup=[{n:"car",c:6,s:150},{n:"bus",c:4,s:100},{n:"truck",c:4,s:50}];
        var typeNumber = Math.floor(Math.random()*3);

        this.initWithFile("res/"+vehLookup[typeNumber].n + Math.floor(Math.random() * vehLookup[typeNumber].c) +".png");// Set the graphic for this sprite

        this.setRotation(theDirection*90);



        switch(theDirection)
        {
            case 0:
                this.setPosition(this.windowSize.width/2 - laneOffset - laneWidth * theLane,-100);
                this._sx=0;
                break;
            case 1:
                this.setPosition(-100,this.windowSize.height/2+laneWidth * theLane +laneOffset);
                this._sy=0;
                break;
            case 2:
                this.setPosition(this.windowSize.width/2 + laneWidth * theLane + laneOffset,this.windowSize.height/2 + yStart);
                this._sx=0;
                break;
            case 3:
                this.setPosition(this.windowSize.width/2 + xStart,this.windowSize.height/2 - laneWidth * theLane  - laneOffset);
                this._sy=0;
                break;
        }
        this._initialSpeed = vehLookup[typeNumber].s;// Math.floor(150 + Math.random()*50)
        this.setSpeed(this._initialSpeed);
    },
     attractAttention:function()
     {
         if (this._attachMode==true)
         {
             return;
         }
        this._attachMode=true;
         this._attractDT=0;
        this.scheduleUpdate();
     },
     update:function(dt)
     {
        if (this._attachMode==true)
        {
            this._attractDT+=dt;
            if (this._attractDT > 0.1)
            {
                this._attractDT=0;

                if (this.getScale()==1)
                {
                    this.setScale(0.95)
                }
                else
                {
                    this.setScale(1);
                }
            }
        }
     },
    getCollisionRect:function()
    {

        var rect = cc.rect(0, 0, this._contentSize.width - 5, this._contentSize.height - 5);
        rect = cc.RectApplyAffineTransform(rect, this.nodeToWorldTransform());
        return rect;
    },
     speedBoost:function()
     {
        if (!this.impeded)
        {
            this.setSpeed(this._initialSpeed*5);
            this._stopped=false;// if the vehicle is _stopped
        }
     },
     getStopped:function()
     {
       return this._stopped;
     },
     setStopped:function(val)
     {
         if (this._stopped==val)
         {
             return;
         }

        this._stopped=val;
        if (val==true)
        {
            this._stoppedTime=cc.Time.now();
        }
        else
        {
            this._stoppedTime=null;
            this.unscheduleUpdate();
            this._attachMode=false;
        }

     },
     getStoppedTime:function()
     {
         if (this._stoppedTime!=null)
         {
            return cc.Time.now() - this._stoppedTime;
         }
         else
         {
             return 0;
         }
     },
     getSpeed:function()
     {
       return this.speed;
     },
     setSpeed:function(theSpeed)
     {
         if (theSpeed == this._speed)
         {
             return; // don't need to do anything if the speed is the same
         }
         this._speed=theSpeed;
         switch(this.direction)
         {
             case 0:
                 this._sy=this._speed;
                 this._sx=0;
                 break;
             case 1:
                 this._sy=0;
                 this._sx=this._speed;
                 break;
             case 2:
                 this._sy=-this._speed;
                 this._sx=0;
                 break;
             case 3:
                 this._sy=0;
                 this._sx=-this._speed;
                 break;
         }
     },
     //Note tick is called from the update function in the game layer.
    tick:function(dt)
    {
        if (!this._stopped && !this.impeded)
        {
            var pos = this.getPosition();
            pos.x += Math.round(this._sx * dt);
            pos.y += Math.round(this._sy * dt);
            this.setPosition(pos.x,pos.y);
        }
    }
});
