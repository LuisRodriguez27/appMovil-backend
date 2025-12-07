// import { Server, Socket } from "socket.io";
// import { ContainerBuilder } from "node-dependency-injection";
// import { UserRepository } from "../context/users/domain/UserRepository";
// import { logger } from "./middleware/logger";


// export class WebSocket {
//   private readonly userRepository: UserRepository;

//   constructor(
//     private readonly server: Server,
//     container: ContainerBuilder,
//   ) {
//     this.userRepository = container.get<UserRepository>("UserRepository");

//     server.on("conection", this.onConection.bind(this));
//   }

//   onConection(socket: Socket) {
//     socket.on("joinRoom", (userId: string) => {
//       socket.join(userId);
//       logger.info(`Socket join user room ${userId}`);
//       this.emitSuccess(socket, `Socket joined to user room ${userId} successfully.`)
//     });

//     this.registerEventHandler(socket)
//   }

//   private registerEventHandler(socket: Socket) {
    
//   }




//   private emitSuccess(socket: Socket, message: string) {
//     socket.emit("serverMessage", { error: false, message })
//   }

//   private emitError(socket: Socket, message:string) {
//     socket.emit("serverMessage", { error: true, message })
//   }
// }