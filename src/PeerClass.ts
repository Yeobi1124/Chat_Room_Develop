import Peer, { DataConnection } from "peerjs";

export enum DataType { PlayerData, Msg, Ready, Start, RemovePlayer };
export enum Position { Home, Lobby, Game };

export interface SendData{
    type: DataType,
    sender : string,
    senderPeerId : string,
    content : any | null
}

export interface MsgData{
    sender : string,
    senderPeerId : string,
    content : string
}

export interface PlayerData{
    name : string,
    peerId : string,
    isReady : boolean,
    isAdmin : boolean
}

export interface Dict<T>{
    [key : string] : T
}

function isSendData(data : unknown) : data is SendData{
    return (
        typeof data === "object" &&
        data != null &&
        "sender" in data &&
        "senderPeerId" in data &&
        "content" in data &&
        "type" in data &&
        typeof (data as SendData).content === "object" &&
        typeof (data as SendData).sender === "string" &&
        typeof (data as SendData).senderPeerId === "string"
        //열거형은 확인 안돼서 일단 제외
    )
}

function isMsgData(data: unknown) : data is MsgData{
    return (
        typeof data === "object" &&
        data != null &&
        "sender" in data &&
        "senderPeerId" in data &&
        "content" in data &&
        typeof (data as MsgData).content === "string" &&
        typeof (data as MsgData).sender === "string" &&
        typeof (data as MsgData).senderPeerId === "string"
    )
}

class PeerData{
    static ID_PREFIX = "ChatRoom_ID_";

    name : string;
    peerID : string;
    isAdmin : boolean;
    peer : Peer;
    pos : Position;

    playerData : Dict<PlayerData>;
    messages : Array<MsgData>;
    conn : Array<DataConnection>;

    //Test
    something : boolean;

    constructor () {
        this.peerID = String(Math.floor(Math.random() * 999999));
        this.name = '';
        this.isAdmin = false;
        this.pos = Position.Home; //일단 메인 페이지로

        this.playerData = {};
        this.messages = [];
        this.conn = [];

        this.peer = this.setPeer();
        //Test
        this.something = false;
    }

    private setPeer() : Peer{
        const peer = new Peer(PeerData.ID_PREFIX + this.peerID);

        peer.on('open', () => {
        });

        peer.on('connection', (conn : DataConnection) => {
            if(this.conn.length && this.conn[0].open)
                this.conn.pop();
            this.conn.push(conn);

            console.log("Data Connection");
            
            conn.on('open', () => {
                this.sendAll(DataType.PlayerData, this.playerData);
            })

            conn.on('data', data => {
                if(isSendData(data))
                    this.receviedHandler(data);
            })

            conn.on('close', () => {
                //참여자가 나갔을 시
                console.log('connection closed');
                this.closeHandler(conn);
            })

            conn.on('error', e => {
                console.log("Connection Error occurred");
                console.log(e);
            })
        })

        peer.on('disconnected', () => {
            console.log('Peer disconnected with server');
        })

        peer.on('error', e => {
            console.log('Peer Error occurred');
            console.log(e);
        })

        return peer;
    }

    connectPeer(remotePeerId : string) : DataConnection | null{
        if(this.isAdmin)
            return null;

        remotePeerId = remotePeerId.includes(PeerData.ID_PREFIX) ? remotePeerId : PeerData.ID_PREFIX + remotePeerId;
        const conn = this.peer.connect(remotePeerId);

        conn.on('open', () => {
            const msgData : MsgData = {
                sender : this.name,
                senderPeerId : this.peerID,
                content : `${this.name} 님이 입장하셨습니다.`
            }

            const playerData : Dict<PlayerData> = {
                [this.peerID] : {
                    name : this.name,
                    peerId : this.peerID,
                    isReady : false,
                    isAdmin : false
                }
            }

            this.sendData(DataType.PlayerData, playerData);
            this.sendData(DataType.Msg, msgData);
        })

        conn.on('data', data => {
            if(isSendData(data))
                this.receviedHandler(data);

            this.something = true;
        })

        conn.on('close', () => {
            //방장이 나갔을 시
            this.closeHandler(conn);
            console.log('fasdfa');
        })

        conn.on('error', e => {
            console.log('Connection Error occurred');
            console.log(e);
        });

        // if(this.conn.length == 0){
        //     console.log('123')
        //     this.conn.push(conn);
        // }
        // else{
        //     console.log('12');
        //     this.conn[0] = conn;
        // }
        this.conn[0] = conn;

        return conn;
    }

    sendAll(type : DataType, content : Object | null = null) : SendData | null{
        if(!this.isAdmin)
            return null;

        const data : SendData = {
            type : type,
            sender : this.name,
            senderPeerId : this.peerID,
            content : content
        };

        this.conn.forEach(e => {
            e.send(data);
        })

        return data;
    }

    sendData(type : DataType, content : any | null = null) : SendData | null{
        if(this.isAdmin)
            return null;

        const data : SendData = {
            type : type,
            sender : this.name,
            senderPeerId : this.peerID,
            content : content
        };

        this.conn[0].send(data);

        return data;
    }

    private receviedHandler(data : SendData) : void{
        switch(data.type){
            case DataType.Msg:
                //data.content = data.content as MsgData;
                if(!isMsgData(data.content))
                    return;

                this.messages.push(data.content);

                if(this.isAdmin)
                    this.sendAll(DataType.Msg, data.content);
                break;
                
            case DataType.PlayerData:
                data.content = data.content as Dict<PlayerData>;
                // if(!isPlayerDataDict(data.content))
                //     return;

                const keys : Array<string> = Object.keys(data.content);

                keys.forEach((e : string) => {
                    //@ts-ignore
                    this.playerData[e] = data.content[e];
                })

                if(this.isAdmin)
                    this.sendAll(DataType.PlayerData, data.content)
                
                break;

            case DataType.Ready:
                if(!this.isAdmin) return;

                this.playerData[data.senderPeerId].isReady = !this.playerData[data.senderPeerId].isReady;
                
                const senddata = { [data.senderPeerId] : this.playerData[data.senderPeerId]};
                this.sendAll(DataType.PlayerData, senddata);
                break;

            case DataType.Start:
                this.pos = Position.Game;
                break;
            
            case DataType.RemovePlayer:
                this.playerData[data.content.replace(PeerData.ID_PREFIX, "")];
        }
    }

    private closeHandler(conn : DataConnection){
        if(this.isAdmin){
            this.sendAll(DataType.RemovePlayer, conn.peer);
            delete this.playerData[conn.peer.replace(PeerData.ID_PREFIX, "")];
        }
        else{
            delete this.playerData[conn.peer.replace(PeerData.ID_PREFIX, "")];
            
            const keys = Object.keys(this.playerData);

            if(keys[0] == this.peerID){
                this.isAdmin = true;
                this.playerData[this.peerID].isAdmin = true;
            }
            else{
                this.connectPeer(keys[0]);
                this.playerData[keys[0]].isAdmin = true;
            }
        }
    }
}

export {PeerData};