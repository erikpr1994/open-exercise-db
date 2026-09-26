import bpy, sys, os, addon_utils
from pathlib import Path
HERE = Path(__file__).resolve().parent
WORK = HERE / '.work'
bpy.ops.wm.read_homefile(use_empty=True)
print('en', addon_utils.enable('bl_ext.user_default.mpfb', default_set=True, handle_error=lambda e: print('ERR', e)))
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
macro = TargetService.get_default_macro_info_dict()
macro.update({'gender': 0.0, 'age': 0.45, 'muscle': 0.62, 'weight': 0.42, 'proportions': 0.75, 'height': 0.5, 'cupsize': 0.45})
macro['race'] = {'asian': 0.2, 'caucasian': 0.5, 'african': 0.3}
body = HumanService.create_human(macro_detail_dict=macro)
print('body', body.name, len(body.data.vertices))
HumanService.add_builtin_rig(body, 'default')
rig = body.parent
print('rig', rig and rig.name, rig and len(rig.data.bones))
D = str(WORK / 'mhdata')
for f, t in ((f'{D}/hair/ponytail01/ponytail01.mhclo', 'Hair'), (f'{D}/eyebrows/eyebrow001/eyebrow001.mhclo', 'Eyebrows')):
    try:
        o = HumanService.add_mhclo_asset(f, body, asset_type=t, subdiv_levels=0, material_type='MAKESKIN')
        print('added', t, o and o.name)
    except Exception as e:
        raise RuntimeError(f'Failed to load {t} asset from {f}') from e
bpy.ops.wm.save_as_mainfile(filepath=str(WORK / 'character.blend'))
print('saved')
os._exit(0)
