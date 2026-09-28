---
title: "Dice Towers"
date: 2026-09-23
tags: ["Games", "Microcontrollers"]
summary: "Paid too much for bluetooth dice, now I need a usecase."
daft: true
---

Sometime a few years ago I stumbled across a post on hackaday where a person had stuffed leds, an imu, and a battery circuit into a dice and had it sending it's rolls to their pc.

The project looked cool and seemed to be working. I'm not a confident electronic engineer, so working with flexible pcb material isn't something I've had a chance or reason to do. That made the whole endeavor look a little like witchcraft, but also a lot like fuck doing that. Even for a cool set of dice. 

Fortunately for me, the person showing off their prototype thought it would make a good product. Whether that's a correct estimation or not, they kickstarted their company, producing these dice.

Turns out it was onerous as hell with import/export problems and mass production quality issues. Not the first kickstarter i've backed that has turned tough in the face of changing landscapes[^1]. However, my use case for these dice dissapeared in the time it took them to exist. Before the KS campaign we had entered lockdown and I was playing RPGs online, over discord, which let my group get together despite us being in fairly disparate locations. It was the rise of the Virtual Tabletop, and each month a new VTT hit the market. Then they let us back outside again and our playgroup fell to pieces. I was waiting on a magical set of[^2] dice I could use to get a little of the tabletop feeling back that would eventually arrive after I had the entire tabletop feeling back.

Now the dice are just fancy led dice. Customisable, sure, but not really connected. The app that dropped as they were being worked on is a weird way to interact with the dice. Your phone has to be open, and not in the dnd beyond app, or looking at some other rulebook repository, but looking at the dice app so you can see a populating list of your rolls. The app also just lest you rng from the app itself, no dice, which is something I understand, usability wise, but feels like it makes the swanky dice redundant. Weird experience. Fortunately though, the discord for supporting the dice included a lot of libraries for hooking the dice up to different languages. Including a microcontroller library. And they'd stuffed it onto the platform.io libraries repo. 

So. If someone else can do it, then I, too, can use that whole process as inspiration to try and do something approaching 'it'. I had no real idea what everyone else's use cases were. For the most part, everyone's projects seemed to be more focussed on capturing that communication data as opposed to doing something useable with it. However, I had the perfect idea. What if I had a big battery powered screen that I could wear as a badge and it would display the results to everybody so I could never be accused of fudging my dice rolls. Terrible idea. The battery would weigh enough to drag my tshirt off my shoulders, I'm sure, but when did I let building a terrible concept get in the way? Normally I just let drifting attention span do that instead.

I started with a tiny screen, an esp, and a time of flight sensor(to stand in for a button).


[^1] I backed the peachy printer, and despite getting no product at the end of it, I did get a wild ride, involving updates about fraud and theft and mortgages.

[^2] Wildly expensive.