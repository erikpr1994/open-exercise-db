import json, sys, os
from pathlib import Path
HERE = Path(__file__).resolve().parent
WORK = HERE / '.work'
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
det = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(base_options=BaseOptions(model_asset_path=str(WORK / 'pose.task'))))
out = json.load(open(WORK / 'poses.json')) if os.path.exists(WORK / 'poses.json') else {}
for ex in sys.argv[1:]:
    frames = []
    for i in (0, 1):
        img = mp.Image.create_from_file(str(HERE.parent / 'images' / ex / f'{i}.jpg'))
        r = det.detect(img)
        if not r.pose_world_landmarks:
            frames = None; break
        frames.append({'world': [[p.x, p.y, p.z] for p in r.pose_world_landmarks[0]],
                       'img': [[p.x * img.width, p.y * img.height, p.visibility] for p in r.pose_landmarks[0]]})
    out[ex] = frames
    print(ex, 'ok' if frames else 'NO POSE', flush=True)
json.dump(out, open(WORK / 'poses.json', 'w'))
os._exit(0)
