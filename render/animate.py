import bpy, json, math, sys, os, addon_utils
from pathlib import Path
HERE = Path(__file__).resolve().parent
WORK = HERE / '.work'
from mathutils import Vector, Quaternion, Matrix

ex, out = sys.argv[1], sys.argv[2]
FRAMES, RES = int(os.environ.get('FRAMES', 72)), int(os.environ.get('RES', 540))
poses = json.load(open(WORK / 'poses.json')).get(ex)
if not poses:
    sys.exit(f'No pose found for {ex}')
addon_utils.enable('bl_ext.user_default.mpfb', default_set=True)
bpy.ops.wm.open_mainfile(filepath=str(WORK / 'character.blend'))
sc = bpy.context.scene
rig = bpy.data.objects['Human.rig']; body = bpy.data.objects['Human']
hair = bpy.data.objects['Human.ponytail01']; brows = bpy.data.objects['Human.eyebrow001']
for o in (body, hair):
    s = o.modifiers.new('smooth', 'SUBSURF'); s.levels = 1; s.render_levels = 1
    for p in o.data.polygons: p.use_smooth = True

def srgb(h):
    c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)
LIGHT = Vector((-0.6, -0.35, 0.72)).normalized()
def toon(name, base, shade):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; n = nt.nodes; n.clear()
    geo = n.new('ShaderNodeNewGeometry')
    dot = n.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'; dot.inputs[1].default_value = LIGHT
    ramp = n.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].color = (*srgb(shade), 1); ramp.color_ramp.elements[1].position = 0.0
    ramp.color_ramp.elements[1].color = (*srgb(base), 1)
    em = n.new('ShaderNodeEmission'); o = n.new('ShaderNodeOutputMaterial')
    nt.links.new(geo.outputs['Normal'], dot.inputs[0]); nt.links.new(dot.outputs['Value'], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], em.inputs[0]); nt.links.new(em.outputs[0], o.inputs[0])
    return m
SKIN, TOP, LEGS, HAIR = toon('skin', 'D98A68', 'C77658'), toon('top', 'EC9A96', 'DC8884'), toon('legs', 'C2477F', 'AD3C70'), toon('hair', '4A2A1A', '3A2012')
body.data.materials.clear()
for m in (SKIN, TOP, LEGS): body.data.materials.append(m)
for o in (hair, brows):
    o.data.materials.clear(); o.data.materials.append(HAIR)
gi = {g.index: g.name for g in body.vertex_groups}
bones = set(rig.data.bones.keys())
def dom(v):
    gs = [g for g in v.groups if gi[g.group] in bones and g.weight > 0]
    return gi[max(gs, key=lambda g: g.weight).group] if gs else ''
names = [dom(v) for v in body.data.vertices]
LEG = ('upperleg', 'lowerleg', 'pelvis', 'root')
for f in body.data.polygons:
    ns = [names[i] for i in f.vertices]; top = max(set(ns), key=ns.count); z = f.center.z
    idx = 0
    if top.startswith(LEG) and z > 0.1 and z < 0.9: idx = 2
    elif top.startswith('spine05') and z < 0.86: idx = 2
    elif top.startswith(('spine', 'breast', 'clavicle')) and z < 1.27: idx = 1
    f.material_index = idx
def mp(p): return Vector((p[0], p[2], -p[1]))
def level(frames):
    best = None
    for lm in frames:
        P = [mp(p) for p in lm]
        for h, k, a in ((23, 25, 27), (24, 26, 28)):
            straight = (P[k] - P[h]).normalized().dot((P[a] - P[k]).normalized())
            v = P[h] - P[a]
            if best is None or straight > best[0]: best = (straight, v)
    pitch = math.atan2(best[1].y, best[1].z)
    pitch = max(-0.5, min(0.5, pitch)) if best[0] > 0.9 else 0.0
    R = Matrix.Rotation(pitch, 3, 'X')
    fr = [[R @ mp(p) for p in lm] for lm in frames]
    h = sum((lm[23] - lm[24] for lm in fr), Vector())
    Y = Matrix.Rotation(-math.atan2(h.y, h.x), 3, 'Z')
    return [[Y @ p for p in lm] for lm in fr]
def targets(P):
    m = lambda a, b: (P[a] + P[b]) / 2
    T = {'pelvis': m(23, 24), 'neck': m(11, 12), 'head': m(7, 8), 'hipL': P[23], 'hipR': P[24], 'shL': P[11], 'shR': P[12]}
    for s, (sh, el, wr, pk, ix, hp, kn, an, ft) in (('L', (11, 13, 15, 17, 19, 23, 25, 27, 31)), ('R', (12, 14, 16, 18, 20, 24, 26, 28, 32))):
        T['upperarm'+s] = P[el] - P[sh]; T['forearm'+s] = P[wr] - P[el]; T['hand'+s] = (P[pk] + P[ix]) / 2 - P[wr]
        T['thigh'+s] = P[kn] - P[hp]; T['shin'+s] = P[an] - P[kn]; T['foot'+s] = P[ft] - P[an]
    return T
TA, TB = [targets(lm) for lm in level([f['world'] for f in poses])]
def frame_of(x, up):
    x = x.normalized(); z = (up - up.project(x)).normalized(); y = z.cross(x)
    return Matrix((x, y, z)).transposed().to_quaternion()
def lerpdir(a, b, t):
    a, b = a.normalized(), b.normalized()
    return Quaternion().slerp(a.rotation_difference(b), t) @ a

pb = rig.pose.bones
for b in pb: b.rotation_mode = 'QUATERNION'
def put(name, rot):
    bone = pb[name]; M = rot.to_matrix().to_4x4(); M.translation = bone.matrix.translation
    bone.matrix = M; bpy.context.view_layer.update()
def world_frame(name, q): put(name, q @ rig.data.bones[name].matrix_local.to_quaternion())
def aim(name, d):
    cur = pb[name].matrix.to_quaternion()
    put(name, (cur @ Vector((0, 1, 0))).rotation_difference(d.normalized()) @ cur)

def pose_frame(t):
    for b in pb: b.rotation_quaternion = (1, 0, 0, 0); b.location = (0, 0, 0)
    bpy.context.view_layer.update()
    up = lerpdir(TA['neck'] - TA['pelvis'], TB['neck'] - TB['pelvis'], t)
    hipx = lerpdir(TA['hipL'] - TA['hipR'], TB['hipL'] - TB['hipR'], t)
    shx = lerpdir(TA['shL'] - TA['shR'], TB['shL'] - TB['shR'], t)
    fp, fc = frame_of(hipx, up), frame_of(shx, up)
    world_frame('root', fp)
    for n in ('spine05', 'spine04', 'spine03'): world_frame(n, fp)
    for n in ('spine02', 'spine01'): world_frame(n, fc)
    hd = lerpdir(TA['head'] - TA['neck'], TB['head'] - TB['neck'], t)
    hd = hd.normalized() * 0.35 + up.normalized() * 0.65
    for n in ('neck01', 'neck02', 'neck03', 'head'): aim(n, hd)
    for s in 'LR':
        ua, fa, hn = (lerpdir(TA[k + s], TB[k + s], t) for k in ('upperarm', 'forearm', 'hand'))
        aim('upperarm01.' + s, ua); aim('upperarm02.' + s, ua)
        aim('lowerarm01.' + s, fa); aim('lowerarm02.' + s, fa); aim('wrist.' + s, hn)
        th, sh = lerpdir(TA['thigh' + s], TB['thigh' + s], t), lerpdir(TA['shin' + s], TB['shin' + s], t)
        aim('upperleg01.' + s, th); aim('upperleg02.' + s, th)
        aim('lowerleg01.' + s, sh); aim('lowerleg02.' + s, sh)
        fd = lerpdir(TA['foot' + s], TB['foot' + s], t)
        flat = Vector((fd.x, fd.y, 0)); fwd = hipx.cross(up); fwd.z = 0
        if flat.length < 0.5 * fd.length or flat.normalized().dot(fwd.normalized()) < 0.3: flat = fwd
        aim('foot.' + s, flat.normalized() + Vector((0, 0, -0.45)))
    low = min(min((rig.matrix_world @ pb['lowerleg02.' + s].tail).z - 0.062, (rig.matrix_world @ pb['foot.' + s].tail).z - 0.036) for s in 'LR')
    R = pb['root'].matrix.copy(); R.translation.z -= low; pb['root'].matrix = R
    bpy.context.view_layer.update()

def curve(f):
    u = (f % FRAMES) / FRAMES
    for a, b, v0, v1 in [(0.0, 0.12, 0, 0), (0.12, 0.5, 0, 1), (0.5, 0.62, 1, 1), (0.62, 1.0, 1, 0)]:
        if a <= u < b:
            k = (u - a) / (b - a); k = k * k * (3 - 2 * k)
            return v0 + (v1 - v0) * k
    return 0
for f in range(FRAMES):
    pose_frame(curve(f))
    for b in pb:
        b.keyframe_insert('rotation_quaternion', frame=f); b.keyframe_insert('location', frame=f)

bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -0.01))
floor = bpy.context.object; floor.scale = (0.7, 2.4, 0.02); floor.data.materials.append(toon('mat', '33544F', '33544F'))
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (*srgb('CFD8A1'), 1)
cam_data = bpy.data.cameras.new('cam'); cam_data.type = 'ORTHO'; cam_data.ortho_scale = float(os.environ.get('ORTHO', 2.0))
cam = bpy.data.objects.new('cam', cam_data); sc.collection.objects.link(cam); sc.camera = cam
ang = math.radians(float(os.environ.get('ANGLE', -90)))
cam.location = (math.sin(ang) * 6, -math.cos(ang) * 6, 0.82 + 6 * math.tan(math.radians(4)))
cam.rotation_euler = (math.radians(86), 0, ang)
sc.render.film_transparent = False; sc.render.engine = 'CYCLES'; sc.cycles.samples = 16; sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
sc.render.resolution_x = sc.render.resolution_y = RES; sc.render.resolution_percentage = 100
sc.frame_start, sc.frame_end = 0, FRAMES - 1
sc.render.image_settings.file_format = 'PNG'
if os.environ.get('STILL'):
    for f in [int(x) for x in os.environ['STILL'].split(',')]:
        sc.frame_set(f); sc.render.filepath = f'{out}_{f}.png'; bpy.ops.render.render(write_still=True)
else:
    sc.render.filepath = out + '/f_'; bpy.ops.render.render(animation=True)
