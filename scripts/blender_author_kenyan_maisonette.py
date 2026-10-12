"""
KINGMAKER: Rise of Africa — Blender 3D Model Authoring Script
Phase 12.2: Kenyan Residential Maisonette (bld_maisonette_01)

Usage:
  blender --background --python scripts/blender_author_kenyan_maisonette.py
"""

import sys
try:
    import bpy
    import math
except ImportError:
    print("This script is intended to be run within Blender (bpy environment).")
    sys.exit(0)

# Clear existing objects in scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# Create collection hierarchy
bld_col = bpy.data.collections.new("bld_maisonette_01")
scene.collection.children.link(bld_col)

lod0_col = bpy.data.collections.new("Geo_LOD0")
lod1_col = bpy.data.collections.new("Geo_LOD1")
bld_col.children.link(lod0_col)
bld_col.children.link(lod1_col)

# 1. Ground Slab & Plinth
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.2, 0.125))
slab = bpy.context.active_object
slab.name = "Maisonette_GroundSlab"
slab.scale = (10.2, 11.4, 0.25)
lod0_col.objects.link(slab)
scene.collection.objects.unlink(slab)

# 2. Ground Floor Walls
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.2, 2.175))
gf_walls = bpy.context.active_object
gf_walls.name = "Maisonette_GroundFloorWalls"
gf_walls.scale = (10.0, 11.2, 2.85)
lod0_col.objects.link(gf_walls)
scene.collection.objects.unlink(gf_walls)

# 3. Intermediate Stringer Slab
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.2, 3.65))
mid_slab = bpy.context.active_object
mid_slab.name = "Maisonette_MidFloorSlab"
mid_slab.scale = (10.2, 11.4, 0.20)
lod0_col.objects.link(mid_slab)
scene.collection.objects.unlink(mid_slab)

# 4. First Floor Walls
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.2, 5.275))
ff_walls = bpy.context.active_object
ff_walls.name = "Maisonette_FirstFloorWalls"
ff_walls.scale = (10.0, 11.2, 3.05)
lod0_col.objects.link(ff_walls)
scene.collection.objects.unlink(ff_walls)

# 5. First Floor Balcony
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 6.0, 3.65))
balcony = bpy.context.active_object
balcony.name = "Maisonette_BalconySlab"
balcony.scale = (4.8, 1.4, 0.22)
lod0_col.objects.link(balcony)
scene.collection.objects.unlink(balcony)

# 6. Low-Cost Collision Proxy
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.1, 4.75))
col = bpy.context.active_object
col.name = "Col_Building"
col.scale = (10.4, 12.4, 9.5)
bld_col.objects.link(col)
scene.collection.objects.unlink(col)

# Sockets (Empty locators)
def add_socket(name, location):
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = 'PLAIN_AXES'
    empty.location = location
    bld_col.objects.link(empty)

add_socket("Socket_Entrance", (0, 4.8, 0.25))
add_socket("Socket_Porch", (0, 6.2, 0.0))
add_socket("Socket_Balcony", (0, 5.8, 3.65))

# Save blend file
blend_path = "public/assets/models/buildings/bld_maisonette_01.blend"
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"Saved Blender project to {blend_path}")
