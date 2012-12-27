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

/*

    Game layer. Does the whole game.

*/
var TrafficControlGameLayer = cc.Layer.extend(
    {
        isMouseDown:false,
        backGroundSprite:null,
        vehicles:null,
        timeSinceLastVehicle:null,
        minDT:null,
        maxDT:null,
        dtArray:null,
        windoSize:null,
        gameState:null,
        touchesBegan:null,
        vehiclesInSwipe:null,
        controller:null,
        scoreLabel:null,
        score:null,
        highScore:null,
        highScoreLabel:null,
        audioEngine:null,
        requiredNumVehicles:null,
        gameStartTime:null,
        userDefaults:null,
        highScorePopup:null,
        playButton:null,
        instructions:null,

        init:function ()
        {

            //////////////////////////////
            // 1. super init first
            this._super();

            var selfPointer = this;

            this.audioEngine = cc.AudioEngine.getInstance();

            this.vehicles = Array();

            this.gameState=0;

            // ask director the window size
            this.windowSize = cc.Director.getInstance().getWinSize();

            // Lazylayer is used for backgrounds that don't change as it boosts performance
            var lazyLayer = new cc.LazyLayer();
            this.addChild(lazyLayer);
            this.backgroundSprite = cc.Sprite.create("res/background.jpg");
            this.backgroundSprite.setPosition(cc.p(this.windowSize.width / 2, this.windowSize.height / 2));
            lazyLayer.addChild(this.backgroundSprite, 0);

            this.scoreLabel = cc.LabelTTF.create("0", "Arial", 32,200);
            this.scoreLabel.setAnchorPoint(cc.p(0, 0));
            this.scoreLabel.setPosition(cc.p(130,this.windowSize.height-48));
            this.scoreLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
            this.addChild(this.scoreLabel);

            this.userDefaults=cc.UserDefault.getInstance();
            this.highScore = this.userDefaults.getIntegerForKey("highScore",0);


            this.highScoreLabel = cc.LabelTTF.create(this.highScore, "Arial", 32,200);
            this.highScoreLabel.setAnchorPoint(cc.p(0, 0));
            this.highScoreLabel.setPosition(cc.p(130,this.windowSize.height-82));
            this.highScoreLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
            this.addChild(this.highScoreLabel);


            this.crash = cc.Sprite.create("res/crash.png");

            this.highScorePopup = cc.Sprite.create(s_imageHighScore);
            this.highScorePopup.setPosition(cc.p(this.windowSize.width / 2, this.windowSize.height/1.2));

            this.instructions = cc.Sprite.create(s_imageInstructions);
            this.instructions.setPosition(cc.p(this.windowSize.width / 2, this.windowSize.height / 3 * 2));

            this.playButton = cc.Sprite.create("res/play-button.png");
            this.playButton.setPosition(cc.p(this.windowSize.width / 2, this.windowSize.height / 5));

            this.gameStateMachine(0);

            this.setTouchEnabled(true);
            this.adjustSizeForWindow();
            lazyLayer.adjustSizeForCanvas();

            window.addEventListener("resize", function (event)
            {
                selfPointer.adjustSizeForWindow();
            });

            return true;
        },
        // A simple state machine to handle the 4 states of the game
        gameStateMachine:function(newState)
        {
            this.gameState=newState;

            switch (this.gameState)
            {
                case 0:
                    // Initial starup - showing instructions and play button
                    this.addChild(this.instructions);
                    this.addChild(this.playButton);
                    break;
                case 1:
                    // Playing
                    this.removeChild(this.instructions);
                    this.removeChild(this.playButton);
                    this.startGame();
                    break;
                case 2:
                    // Game over
                    // delay before play button is displayed again
                    break;
                case 3:
                    //Game over. Wait for player to press Play button to start again
                    this.addChild(this.playButton);
                    break;
                default:
                    // should not ever get here ;0)
                    break;
            }
        },

        updateHighScore:function()
        {
            this.highScore=this.score;
            //localStorage.setItem('highScore',this.highScore);
            this.userDefaults.setIntegerForKey("highScore",this.highScore);

            this.highScoreLabel.setString(this.highScore);
        },
        updateScore:function()
        {
            this.scoreLabel.setString(this.score);
        },
        addVehicle:function(direction,laneNumber)
        {
            var vehicle = new Vehicle(direction,laneNumber);

            // Check there isn't a vehicle stopped in the location the vehicle was added
            for(var i=0;i<this.vehicles.length;i++)
            {
                if (cc.rectIntersectsRect(this.vehicles[i].getBoundingBoxToWorld(),vehicle.getBoundingBoxToWorld()))
                {
                    //console.log("cant add vehicle at this location");
                    return null;// Don't add this vehicle
                }
            }

            this.addChild(vehicle);
            this.vehicles.push(vehicle);
            return vehicle;
        },
        update:function(dt)
        {

            // Only handle updates when the game is being played (not when waiting for user to press play button)
            if (this.gameState!=1)
            {
                return;
            }

            this.updateScore();
            var vehiclesToRemove= new Array();
            var vehicle;

            for (var i=0; i<this.vehicles.length; i++)
            {
                vehicle = this.vehicles[i];
                vehicle.tick(dt);// Move the vehicle
                if (this.vehicles[i].getPosition().y > this.windowSize.height + 100 || this.vehicles[i].getPosition().y < -100 || this.vehicles[i].getPosition().x > this.windowSize.width + 100 || this.vehicles[i].getPosition().x < -100 )
                {
                    //console.log();
                    var timeTaken = Math.max(0,10000 - (cc.Time.now() - vehicle.startTime));


                   // console.log(timeTaken);
                    this.score += Math.floor(timeTaken/5)*5;
                    vehiclesToRemove.push(i);
                }
                vehicle.impeded=false;
                if (vehicle.getStopped())
                {
                    if (vehicle.getStoppedTime()>5000)
                    {
                        //console.log("Vehicle waiting too long");
                        vehicle.attractAttention();
                        if (vehicle.getStoppedTime()>10000)
                        {
                            vehicle.setStopped(false);
                        }
                    }

                }
            }


            // Collision detection between vehicles
            for (var i=0; i<this.vehicles.length; i++)
            {
                // its not possible for vehicles to collide on outer edge of the screen (fortunately!)
                for(var j=i+1;j<this.vehicles.length;j++)
                {
                    if (this.vehicles[i].direction != this.vehicles[j].direction)
                    {
                        if (cc.rectIntersectsRect(this.vehicles[i].getCollisionRect(),this.vehicles[j].getCollisionRect()))
                        {

                                // Level Over
                                var p1= this.vehicles[i].getPosition();
                                var p2= this.vehicles[j].getPosition();
                                this.crash.setPosition(Math.floor((p1.x+p2.x)/2),Math.floor((p1.y+p2.y)/2));
                                this.addChild(this.crash);
                                this.gameOver();
                                return;

                        }
                    }
                    else
                    {
                        if (cc.rectIntersectsRect(this.vehicles[i].getBoundingBoxToWorld(),this.vehicles[j].getBoundingBoxToWorld()))
                        {
                            this.vehicles[j].impeded=true;
                        }
                    }

                }
            }

            if (vehiclesToRemove.length!=0)
            {
                vehiclesToRemove.sort(function(x,y){return y-x;})

                for (var i=0; i<vehiclesToRemove.length; i++)
                {
                    this.removeChild(this.vehicles[vehiclesToRemove[i]]);
                    this.vehicles.splice(vehiclesToRemove[i],1);
                }
            }

            // Add some  vehicles
            var index;
            this.requiredNumVehicles = (cc.Time.now() - this.gameStartTime) /15000 + 3;// Gradually increase the number of vehicles ever 15,000 ms add one vehicles. Start with 3 vehicles.
            for(var i=0;i<4;i++)
            {
                for(var laneNumber=0;laneNumber<2;laneNumber++)
                {
                    index=i*2+laneNumber;
                    this.timeSinceLastVehicle[index]+=dt;

                    if (this.timeSinceLastVehicle[index] > (Math.random()/4 + 1))
                    {
                        if (this.vehicles.length<this.requiredNumVehicles && Math.random()>0.996)
                        {

                            var c = this.addVehicle(i,laneNumber);
                            this.timeSinceLastVehicle[index]=0;
                        }
                    }
                }
            }
        },
        gameOver:function()
        {
            this.unscheduleUpdate();

            this.audioEngine.playEffect("res/crash_ogg.ogg",false);


            this.gameState=2;

            var localThis=this;
            if (this.score> this.highScore)
            {
                this.updateHighScore();
                this.addChild(this.highScorePopup);
            }

            setTimeout(function() { localThis.gameStateMachine(3); },4000);// There may be a cocos2d way to do this.

        },
        startGame:function()
        {
            this.timeSinceLastVehicle=[0,0,0,0,0,0,0,0];
            this.score=0;
            this.gameStartTime=cc.Time.now();
            this.removeChild(this.highScorePopup);

            while(this.vehicles.length > 0)
            {
                this.removeChild(this.vehicles[0]);
                this.vehicles.splice(0,1);
            }
            this.removeChild(this.crash);
           // this.gameState=1;
            this.requiredNumVehicles=3;
            this.scheduleUpdate();
        },

        onTouchesBegan:function (touches, event)
        {
            if (this.gameState==1)
            {
                this.touchesBegan=touches;
                this.isMouseDown = true;
                this.vehiclesInSwipe=new Array();
            }

        },

        onTouchesMoved:function (touches, event)
        {
            if (this.isMouseDown && this.gameState==1)
            {
                if (touches)
                {
                    for(var i=0;i<this.vehicles.length;i++)
                    {
                        if (cc.rectContainsPoint(this.vehicles[i].getBoundingBoxToWorld(),touches[0].getLocation()))
                        {
                            this.vehiclesInSwipe.push(this.vehicles[i]);
                            //console.log("adding vehicle "+i);
                        }
                    }
                }
            }
        },
        onTouchesEnded:function (touches, event)
        {
            switch(this.gameState)
            {
                case 0:
                    this.gameStateMachine(1);// Goto state 1
                    break;
                case 1:
                {
                    this.isMouseDown = false;
                    var touchPos = touches[0].getLocation();
                    var r;
                    var swipe = this.touchesBegan[0].getLocation();
                    var delta = {x:swipe.x - touchPos.x,y:swipe.y-touchPos.y};
                    var mag = delta.x * delta.x + delta.y * delta.y;

                    var theta = (Math.atan2(delta.x,delta.y) + Math.PI) * 180/Math.PI;


                    if (theta > 360 - 45 || theta <= 45)
                    {
                        dir=0;
                    }
                    else
                    {
                        if (theta > 45 && theta <= 180 - 45)
                        {
                            dir=1;
                        }
                        else
                        {
                            if (theta > 180 - 45 && theta <= 180+45)
                            {
                                dir=2;
                            }
                            else
                            {
                                dir=3;
                            }
                        }
                    }


                    if (mag>5000)
                    {
                        for(var i=0;i< this.vehiclesInSwipe.length;i++)
                        {
                            if (this.vehiclesInSwipe[i].direction==dir)
                            {
                                this.vehiclesInSwipe[i].speedBoost();
                            }
                        }
                    }
                    else
                    {
                        for(var i=0;i<this.vehicles.length;i++)
                        {
                            if (cc.rectContainsPoint(this.vehicles[i].getBoundingBoxToWorld(),touchPos))
                            {
                                //this.vehicles[i].stopped = 1 - this.vehicles[i].stopped;// toggle vehicle stopped

                                if (this.vehicles[i].getStopped())
                                {
                                    this.vehicles[i].setStopped(false);
                                }
                                else
                                {
                                    this.vehicles[i].setStopped(true);
                                }
                            }
                        }
                    }
                }
                break;
                case 2:
                    // Delay after game end.
                    // Don't do anything
                    break;
                case 3:
                    this.gameStateMachine(1);
                    break;

            }

        },
        onTouchesCancelled:function (touches, event)
        {
            console.log("onTouchesCancelled");
        },
        adjustSizeForWindow:function ()
        {
            //console.log("adjustSizeForWindow");
            var margin = document.documentElement.clientWidth - document.body.clientWidth;
            if (document.documentElement.clientWidth < cc.originalCanvasSize.width)
            {
                cc.canvas.width = cc.originalCanvasSize.width;
            }
            else
            {
                cc.canvas.width = document.documentElement.clientWidth - margin;
            }
            if (document.documentElement.clientHeight < cc.originalCanvasSize.height)
            {
                cc.canvas.height = cc.originalCanvasSize.height;
            }
            else
            {
                cc.canvas.height = document.documentElement.clientHeight - margin;
            }

            var xScale = cc.canvas.width / cc.originalCanvasSize.width;
            var yScale = cc.canvas.height / cc.originalCanvasSize.height;
            if (xScale > yScale)
            {
                xScale = yScale;
            }
            cc.canvas.width = cc.originalCanvasSize.width * xScale;
            cc.canvas.height = cc.originalCanvasSize.height * xScale;
            var parentDiv = document.getElementById("Cocos2dGameContainer");
            if (parentDiv)
            {
                parentDiv.style.width = cc.canvas.width + "px";
                parentDiv.style.height = cc.canvas.height + "px";
            }
            cc.renderContext.translate(0, cc.canvas.height);
            cc.renderContext.scale(xScale, xScale);
            cc.Director.getInstance().setContentScaleFactor(xScale);
        },
        // a selector callback
        menuCloseCallback:function (sender)
        {
            cc.Director.getInstance().end();
        }
    });
