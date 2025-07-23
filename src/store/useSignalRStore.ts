import { create } from "zustand";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

interface SignalRStoreState {
  connection: HubConnection | null;
  connect: (
    accessToken: string,
    backendUrl: string,
    groups: string[], // <-- thêm chỗ join group
    onEvent: (eventName: string, data: any) => void
  ) => void;
  disconnect: () => void;
}

const useSignalRStore = create<SignalRStoreState>((set, get) => ({
  connection: null,

  connect: (
    accessToken,
    backendUrl,
    groups,
    onEvent
  ) => {
    const currentConnection = get().connection;
    if (currentConnection) {
      currentConnection.stop();
    }

    const connection = new HubConnectionBuilder()
      .withUrl(`${backendUrl}/hubs/request`, {
        accessTokenFactory: () => accessToken,
        withCredentials: false,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build();

    connection.start()
      .then(async () => {
        console.log("✅ SignalR Connected.");

        for (const group of groups) {
          await connection.invoke("JoinGroup", group);
          console.log(`✅ Joined group: ${group}`);
        }

        connection.on("NotificationReceived", (data) => {
          onEvent("NotificationReceived", data);
        });

        connection.on("TaskStatusUpdated", (data) => {
          onEvent("TaskStatusUpdated", data);
        });

        onEvent("ConnectionEstablished", {});
      })
      .catch((err) => {
        console.error("❌ SignalR Connection Error:", err);
      });

    connection.onclose(() => {
      console.log("🚫 SignalR connection closed");
      set({ connection: null });
    });

    set({ connection });
  },

  disconnect: () => {
    const connection = get().connection;
    if (connection) {
      connection.stop();
      set({ connection: null });
    }
  },
}));

export default useSignalRStore;