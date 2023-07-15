import AmmoLib from "ammo-es";

export let Ammo = null;
export let world = null;

export function initAmmo() {
    return new Promise(resolve => {
        AmmoLib().then((re) => {
            Ammo = re;

            const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
            const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            const overlappingPairCache = new Ammo.btDbvtBroadphase();
            const solver = new Ammo.btSequentialImpulseConstraintSolver();

            world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache,
                solver, collisionConfiguration);
            world.setGravity(new Ammo.btVector3(0, -9.81, 0));

            resolve();
        });
    });
}
