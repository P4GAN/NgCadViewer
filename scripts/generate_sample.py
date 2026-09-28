"""Generate the demo sample: a small desktop robot arm as a coloured, nested STEP assembly.

Usage: pip install cadquery && python scripts/generate_sample.py projects/demo-app/public/samples/robot-arm.step
"""
import math
import sys
import cadquery as cq
from cadquery import Assembly, Color, Location, Vector

ORANGE = Color(0.96, 0.47, 0.10)
DARK = Color(0.22, 0.23, 0.26)
ALU = Color(0.78, 0.80, 0.83)
BLUE = Color(0.16, 0.38, 0.78)

Y = Vector(0, 1, 0)
# CadQuery is Z-up; three.js is Y-up, so stand each top-level part upright for the viewer.
# (Rotating the root assembly instead makes occt-import-js flatten the whole tree.)
UP = Location(Vector(0, 0, 0), Vector(1, 0, 0), -90)


def roty(pos, deg):
    return Location(Vector(*pos), Y, deg)


# --- base -------------------------------------------------------------------
base_plate = (
    cq.Workplane("XY").box(160, 160, 12, centered=(True, True, False))
    .edges("|Z").fillet(14)
    .faces(">Z").workplane().rect(125, 125, forConstruction=True).vertices().cboreHole(8, 14, 4)
)
turntable = (
    cq.Workplane("XY").workplane(offset=12).circle(56).extrude(22)
    .faces(">Z").edges().fillet(4)
)

# --- shoulder ---------------------------------------------------------------
PIVOT_Z = 90
# Clevis side plate: rectangle with a round top around the pivot
side = (
    cq.Workplane("XZ").moveTo(-32, 34).lineTo(32, 34).lineTo(32, PIVOT_Z)
    .threePointArc((0, PIVOT_Z + 32), (-32, PIVOT_Z)).close().extrude(10)
)
side = side.cut(cq.Workplane("XZ").center(0, PIVOT_Z).circle(11).extrude(-40, both=True))
bracket_floor = cq.Workplane("XY").workplane(offset=34).rect(64, 72).extrude(10).edges("|Z").fillet(6)
shoulder_bracket = side.translate((0, 36, 0)).union(side.translate((0, -26, 0))).union(bracket_floor)
shoulder_pin = cq.Workplane("XZ").center(0, PIVOT_Z).circle(10).extrude(46, both=True)

# --- upper arm (built along +Z from its pivot) ------------------------------
UPPER_LEN = 170
UPPER_ANGLE = 28
upper_link = (
    cq.Workplane("XY").rect(38, 30).extrude(UPPER_LEN)
    .edges("|Z").fillet(8)
    .faces(">Y").workplane(centerOption="CenterOfBoundBox")
    .slot2D(UPPER_LEN - 70, 14, 90).cutBlind(-6)
)
elbow_hub = cq.Workplane("XZ").center(0, UPPER_LEN).circle(20).extrude(28, both=True)

# --- forearm ----------------------------------------------------------------
elbow = Vector(
    UPPER_LEN * math.sin(math.radians(UPPER_ANGLE)), 0,
    PIVOT_Z + UPPER_LEN * math.cos(math.radians(UPPER_ANGLE)),
)
FORE_LEN = 140
FORE_ANGLE = 105
forearm_link = (
    cq.Workplane("XY").workplane(offset=18).rect(30, 26).extrude(FORE_LEN - 18)
    .edges("|Z").fillet(7)
)
wrist = cq.Workplane("XY").workplane(offset=FORE_LEN).circle(17).extrude(22).faces(">Z").edges().fillet(3)

# --- gripper (local origin at the end of the wrist) -------------------------
gripper_body = cq.Workplane("XY").box(26, 70, 18, centered=(True, True, False)).edges("|X").fillet(5)


def make_finger():
    # Each finger needs its own shape, otherwise both instances share one name
    return (
        cq.Workplane("YZ").moveTo(-5, 18).lineTo(5, 18).lineTo(3, 62).lineTo(-3, 62).close()
        .extrude(9, both=True).edges("|X").fillet(1.5)
    )

# --- assembly tree ----------------------------------------------------------
gripper = (
    Assembly(name="gripper", loc=Location(Vector(0, 0, FORE_LEN + 22)))
    .add(gripper_body, name="gripper_body", color=DARK)
    .add(make_finger(), name="finger_left", color=BLUE, loc=Location(Vector(0, -24, 0)))
    .add(make_finger(), name="finger_right", color=BLUE, loc=Location(Vector(0, 24, 0)))
)
forearm = (
    Assembly(name="forearm", loc=UP * Location(elbow, Y, FORE_ANGLE))
    .add(forearm_link, name="forearm_link", color=ALU)
    .add(wrist, name="wrist", color=ORANGE)
    .add(gripper)
)
upper_arm = (
    Assembly(name="upper_arm", loc=roty((0, 0, PIVOT_Z), UPPER_ANGLE))
    .add(upper_link, name="upper_arm_link", color=ALU)
    .add(elbow_hub, name="elbow_hub", color=ORANGE)
)
shoulder = (
    Assembly(name="shoulder", loc=UP)
    .add(shoulder_bracket, name="shoulder_bracket", color=ORANGE)
    .add(shoulder_pin, name="shoulder_pin", color=ALU)
    .add(upper_arm)
)
base = (
    Assembly(name="base", loc=UP)
    .add(base_plate, name="base_plate", color=DARK)
    .add(turntable, name="turntable", color=ORANGE)
)
robot_arm = (
    Assembly(name="robot_arm")
    .add(base)
    .add(shoulder)
    .add(forearm)
)

robot_arm.export(sys.argv[1])
print("wrote", sys.argv[1])
