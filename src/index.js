// https://unpkg.com/browse/@babylonjs/core@6.11.1/
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator.js";
import { ShadowGeneratorSceneComponent } from "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { Quaternion } from "@babylonjs/core/Maths/math.vector.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Ammo, initAmmo, world } from "./init-ammo.js";

async function init() {

    await initAmmo();

    const canvas = document.getElementById("renderCanvas");
    const engine = new Engine(canvas, true);

    // This creates a basic Babylon Scene object (non-mesh)
    const scene = new Scene(engine);

    // This creates and positions a free camera (non-mesh)
    const camera = new ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2.5, 15, new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero()); // This targets the camera to scene origin
    camera.attachControl(canvas, true); // This attaches the camera to the canvas

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new DirectionalLight("Light", new Vector3(0, -8, 2), scene);
    light.intensity = 0.7; // Default intensity is 1. Let's dim the light a small amount

    const shadowGen = new ShadowGenerator(1024, light);

    // Our built-in 'sphere' shape.
    const sphere = MeshBuilder.CreateSphere("Sphere", { diameter: 2, segments: 32 }, scene);
    shadowGen.addShadowCaster(sphere);

    // Our built-in 'ground' shape.
    const ground = MeshBuilder.CreateBox("Ground", { width: 6, height: 0.1, depth: 6 }, scene);
    ground.addRotation(0, 0, 0.1);
    ground.receiveShadows = true;

    const groundMesh = scene.getMeshByName("Ground");
    const groundSizes = groundMesh.getBoundingInfo().maximum;
    const groundInitialPosition = new Ammo.btVector3(0, 0, 0);
    const groundRotQ = groundMesh.rotation.toQuaternion();
    const groundInitialRotation = new Ammo.btQuaternion(groundRotQ.x, groundRotQ.y,
        groundRotQ.z, groundRotQ.w);
    const groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(groundInitialPosition);
    groundTransform.setRotation(groundInitialRotation);
    const groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
    const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(
        groundSizes.x, groundSizes.y, groundSizes.z));
    const groundLocalInertia = new Ammo.btVector3(0, 0, 0);
    const groundMass = 0;
    const groundRigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(groundMass,
        groundMotionState, groundShape, groundLocalInertia);
    const groundRigidBody = new Ammo.btRigidBody(groundRigidBodyInfo);
    groundRigidBody.setRestitution(0.9);
    world.addRigidBody(groundRigidBody);

    // Sphere:
    const sphereMesh = scene.getMeshByName("Sphere");
    const sphereBounding = sphereMesh.getBoundingInfo().maximum;
    const sphereInitialPosition = new Ammo.btVector3(2.5, 5, 0);
    const sphereInitialRotation = new Ammo.btQuaternion(0, 0, 0, 1);
    const sphereTransform = new Ammo.btTransform();
    sphereTransform.setIdentity();
    sphereTransform.setOrigin(sphereInitialPosition);
    sphereTransform.setRotation(sphereInitialRotation);
    const sphereMotionState = new Ammo.btDefaultMotionState(sphereTransform);
    const sphereShape = new Ammo.btSphereShape(sphereBounding.y + .05); // add a little space so lines render outside of the sphere
    const sphereLocalInertia = new Ammo.btVector3(0, 0, 0);
    const sphereMass = 1;
    sphereShape.calculateLocalInertia(sphereMass, sphereLocalInertia);
    const sphereRigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(sphereMass,
        sphereMotionState, sphereShape, sphereLocalInertia);
    const sphereRigidBody = new Ammo.btRigidBody(sphereRigidBodyInfo);
    sphereRigidBody.setActivationState(4); // Disable deactivation
    sphereRigidBody.setRestitution(0.9);
    world.addRigidBody(sphereRigidBody);

    class DebugDrawer {
        constructor(world) {
            this.heap = null;
            this.debugDrawer = new Ammo.DebugDrawer();
            this.debugDrawer.drawLine = ((from, to, color) => { this.drawLine(from, to, color) }).bind(this);
            this.debugDrawer.setDebugMode = () => {};

            this.debugMode = 1; // 0 - 0ff, 1 - on
            this.debugDrawer.getDebugMode = () => { return this.debugMode; };
            this.debugDrawer.setDebugMode(1);

            this.debugDrawer.drawContactPoint = (pointOnB, normalOnB, distance, lifeTime, color) => {};
            this.debugDrawer.reportErrorWarning = (warningString) => {};
            this.debugDrawer.draw3dText = (location, textString) => {};

            world.setDebugDrawer(this.debugDrawer);

            this.fromX = 0;
            this.fromY = 0;
            this.fromZ = 0;
            this.toX = 0;
            this.toY = 0;
            this.toZ = 0;
            this.r = 0;
            this.g = 0;
            this.b = 0;
        }

        begin() {
            this.debugColors = [];
            this.debugLines = [];
        }

        drawLine(from, to, color) {
            this.heap = Ammo.HEAPF32;

            this.fromX = this.heap[(parseInt(from) + 0) / 4];
            this.fromY = this.heap[(parseInt(from) + 4) / 4];
            this.fromZ = this.heap[(parseInt(from) + 8) / 4];

            this.toX = this.heap[(parseInt(to) + 0) / 4];
            this.toY = this.heap[(parseInt(to) + 4) / 4];
            this.toZ = this.heap[(parseInt(to) + 8) / 4];

            this.r = this.heap[(parseInt(color) + 0) / 4];
            this.g = this.heap[(parseInt(color) + 4) / 4];
            this.b = this.heap[(parseInt(color) + 8) / 4];

            this.debugLines.push(new Vector3(this.fromX, this.fromY, this.fromZ));
            this.debugLines.push(new Vector3(this.toX, this.toY, this.toZ));

            this.debugColors.push(new Color4(this.r, this.g, this.b, 1));
            this.debugColors.push(new Color4(this.r, this.g, this.b, 1));
        }

        end() {
            if (!this.linesystem) {
                this.linesystem = MeshBuilder.CreateLineSystem("linesystem", { lines: [this.debugLines], colors: [this.debugColors], updatable: true }, scene);
            } else {
                MeshBuilder.CreateLineSystem("line", { lines: [this.debugLines], instance: this.linesystem });
            }
        }
    }

    const debugDrawer = new DebugDrawer(world);

    let currentTime, dt;
    let lastTime = Date.now();;

    // Update physics engine animation on Before Render
    let frame = 0;
    scene.onBeforeRenderObservable.add(() => {

        const motionState = sphereRigidBody.getMotionState();
        const transform = new Ammo.btTransform();
        motionState.getWorldTransform(transform);

        const spherePos = transform.getOrigin();
        sphereMesh.setAbsolutePosition(new Vector3(
            spherePos.x(), spherePos.y(), spherePos.z()
        ));

        const sphereRot = transform.getRotation();
        sphereMesh.rotationQuaternion = new Quaternion(
            sphereRot.x(),
            sphereRot.y(),
            sphereRot.z(),
            sphereRot.w()
        );

        currentTime = Date.now();
        dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        world.stepSimulation(dt, 8);

        debugDrawer.begin();
        world.debugDrawWorld();
        debugDrawer.end();

        // Reset the sphere every 350 frames
        if (frame >= 350) {
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(2.5, 5, 0));
            transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
            sphereRigidBody.setWorldTransform(transform);
            sphereRigidBody.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
            sphereRigidBody.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
            return frame = 0
        }

        frame++
    });

    window.onresize = () => {
        engine.resize();
    }

    engine.runRenderLoop(() => {
        scene.render();
    });
}

init();
