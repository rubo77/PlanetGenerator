# Procedural Planet Generator

A procedural planet generator that uses a clever templating system and a mildly terrifying shader to produce an endless stream of alien planets. The description, appearance, and basic stats are all linked properly, so if the description says the plants are blue, the vegetation-covered parts of the surface are shown as blue, and so on. It should also mostly avoid impossibilities like land-dwelling creatures on water worlds.

Influences: An earlier project that generated entire SF universes at a shallower level. No Man's Sky. Sid Meier's Alpha Centauri.

Licensed as GPLv3. Other licenses available upon request. Feel free to [ask questions](mailto:zarkonnen@gmail.com) or [make suggestions](https://github.com/Zarkonnen/GenGen/issues).

Icons by streamlineicons.com.

## Start locally

Start your local webserver with `server.py`. Then you can access the tool via http://localhost:8000

## Keyboard shortcuts

- Download Text (T)
- Download Image (D)
- Switch to Map (M)
- View/Set ID (I)
- Random New Planet (R)

## Generate planets from the console

You can batch-generate planet PNGs from the command line using
`generate_planets.mjs`. This script launches a headless Chromium browser,
loads the WebGL shader, and exports each planet as a PNG file.

### Prerequisites

```sh
npm install playwright
npx playwright install chromium
```

### Usage

```sh
# Generate 10 planets at 512px into ./planets/
node generate_planets.mjs

# Generate 100 planets at 512px into ./planets/
node generate_planets.mjs 100

# Generate 50 planets at 256px into ./out/
node generate_planets.mjs 50 ./out 256
```

### Output

- `planet_000.png` ... `planet_NNN.png` — the generated planet images
- `planets_params.log` — all shader parameters per planet for reproducible
  regeneration (seed, colors, noise scales, lighting, etc.)

### Log format

Each planet entry in `planets_params.log` looks like:

```
# planet_000.png
seed=planet00000000
angle=0.30177076868191444
rotspeed=0.011043297864363406
light=1.6252913855049347
zLight=0.7040990714336726
modValue=28
noiseOffset=[97, 48]
noiseScale=[10, 9]
noiseScale2=[221, 221]
noiseScale3=[33, 33]
cloudNoise=[9, 27]
cloudiness=0.35
waterLevel=0
rivers=0.5
temperature=0.7
ocean=[0.05, 0.22, 0.38]
cold=[0.53, 0.102, 0.100]
temperate=[0.79, 0.109, 0.68]
warm=[0.119, 0.141, 0.82]
hot=[0.223, 0.193, 0.148]
speckle=[0.5, 0.5, 0.5]
clouds=[0.9, 0.9, 0.9]
haze=[0.15, 0.15, 0.2]
lightColor=[1.0, 1.0, 1.0]
```

To reproduce a specific planet, set the same `seed` and all listed
parameters as WebGL uniforms before rendering.

## Online version

The latest version runs at https://planetgenerator.spacetrace.org/

## Additional Contributors ✨

Thanks goes to these wonderful people:

* [Efface Studios](https://www.effacestudios.com) Image Download Code
* [David Stark](https://github.com/Zarkonnen/GenGen) Upstream GenGen
