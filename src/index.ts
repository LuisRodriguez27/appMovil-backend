import {serverInstance} from "./app/server";

(async () => {
    await serverInstance.start()
})()