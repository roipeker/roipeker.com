+++
date = "2017-11-26T00:00:00-03:00"
image = "/img/portfolio/app_gamebuzz_thm.jpg"
showonlyimage = false
title = "GameBuzz"
weight = 9

+++
**GameBuzz !** ◂ StudioNorth - 2016

<!--more-->

![GameBuzz poster](/img/portfolio/app_gamebuzz_thm.jpg "GameBuzz poster")


### Overview:

The game system itself is not multiplatform, but both the source code relies on a multiplatform system:

* There's a Windows / OSX "host" running in the ELO TV, and the game interface itself.
* an iPad running as a controller and managed by the host (you can check more on the website).
* 6 "buzzers" used by the players.
* A cloud backend to store all games' data and skins.

I call it a "game system" because, beyond the interconnected devices, it packages (up to) 6 games inside. Which games, rounds, logos, colors,  and media content, is selected by the webadmin.

### Tech info:

Built using **AS3 + AIR +** [**Starling framework**](https://gamua.com/starling/ "Starling")**.**

The apps (client + controller) uses the same codebase project, sharing \~74% of the core functionality (mostly network and configuration and some UI stuffs), beyond game specifics.

The controller (iPad) and host (ELO TV) communicates through P2P multicast protocol, so there's no special setup required on the devices.

### Demo:

This time, the overview and video of the app(s) it's on SN side.  
Check the [product's website](https://www.studionorth.com/gamebuzz/ "GameBuzz! site") for more infomation!

Here's a video reel showing the system live:

{{< youtube RxJhhZ5Lp84 >}}