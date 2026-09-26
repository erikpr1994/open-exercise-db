import json, sys
from pathlib import Path
import torch
HERE = Path(__file__).resolve().parent
WORK = HERE / '.work'
CKPT = WORK / 'sam-3d-body-dinov3'
sys.path.insert(0, str(WORK / 'sam-3d-body'))
import sam_3d_body.sam_3d_body_estimator as estimator
import sam_3d_body.models.meta_arch.sam3d_body as sam3d_body
from sam_3d_body import load_sam_3d_body, SAM3DBodyEstimator

hub_load = torch.hub.load
torch.hub.load = lambda repo, model, source, **kw: hub_load(str(WORK / 'dinov3'), model, source='local', **kw)
torch.Tensor.cuda = lambda self, *args, **kwargs: self
for module in (estimator, sam3d_body):
    module.recursive_to = lambda x, device, to=module.recursive_to: to(x, 'cpu' if device == 'cuda' else device)

model, cfg = load_sam_3d_body(str(CKPT / 'model.ckpt'), device='cpu', mhr_path=str(CKPT / 'assets' / 'mhr_model.pt'))
body = SAM3DBodyEstimator(sam_3d_body_model=model, model_cfg=cfg)
path = WORK / 'poses.json'
out = json.loads(path.read_text()) if path.exists() else {}
for ex in sys.argv[1:]:
    people = [body.process_one_image(str(HERE.parent / 'images' / ex / f'{i}.jpg'), inference_type='body') for i in (0, 1)]
    out[ex] = [p[0]['pred_joint_coords'].round(4).tolist() for p in people] if all(people) else None
    print(ex, 'ok' if out[ex] else 'NO POSE', flush=True)
path.write_text(json.dumps(out))
