# Exercise animations (prototype)

Turns the two public-domain photos of an exercise into a looping animation
of one flat-shaded character, drawn in Blender.

1. `pose.py` finds the 3D skeleton in `images/<id>/0.jpg` and `1.jpg` with
   SAM 3D Body. It writes the 127 joints of the Momentum Human Rig (MHR)
   for each photo to `.work/poses.json`.
2. `character.py` builds the character once with MPFB (MakeHuman for
   Blender): body, skeleton, ponytail, eyebrows.
3. `animate.py` levels the camera tilt and turn, moves the MakeHuman
   skeleton from pose 0 to pose 1 and back along the MHR joints, and
   renders the frames with Cycles.

## Run

`setup.sh` downloads the SAM 3D Body weights from Hugging Face. They are
gated: request access on
[facebook/sam-3d-body-dinov3](https://huggingface.co/facebook/sam-3d-body-dinov3),
wait for Meta to accept it, and export `HF_TOKEN`.

```sh
render/setup.sh
render/run.sh bodyweight-squat dumbbell-lunges
```

The GIFs go to `render/.work/out/`. Everything runs on the CPU. On 4
cores, SAM 3D Body takes about 1 minute for the two photos of one
exercise, most of it to load the model. The render takes about 5 minutes
per exercise.

## Licences

- Photos: public domain (free-exercise-db, Unlicense).
- MakeHuman system assets: CC0.
- MPFB add-on: GPL-3.0.
- SAM 3D Body code and weights: SAM License.
- DINOv3 code: DINOv3 License.
- MHR model: Apache-2.0.

The add-on and the models run as tools. The GIF contains only the MakeHuman
character.

## Status

- The arms keep their depth: on `dumbbell-lunges` they hang at the sides,
  where MediaPipe put them behind the back.
- The spine bends in two parts: pelvis to mid back, and mid back to neck.
- No equipment props yet. A seated exercise shows a half squat, because
  there is no bench.
- No scheduled job yet.
