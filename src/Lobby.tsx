import { useState, useEffect } from "react";
//@ts-ignore
import { PeerData, DataType, Position, MsgData } from "./PeerClass";

type props = {
    peer : PeerData
    UpdatePos : any
}

function Lobby({peer, UpdatePos} : props){
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Array<Object>>([]);
    const [ready, setReady] = useState(false);

    const sendData = (type : DataType, content : Object | null = null) : void => {
        if(peer.isAdmin){
            if(type == DataType.Msg){
                //@ts-ignore
                peer.messages.push(content);
            }
            peer.sendAll(type, content);
        }
        else
            peer.sendData(type, content);
    }

    const updateData = () => {
        setMessages(peer.messages);
        UpdatePos();
        console.log("update data");
    }

    const gameStart = () => {
        console.log("Game Start Act");

        let go = true;

        Object.keys(peer.playerData).forEach(e => {
            if(!peer.playerData[e].isReady && !peer.playerData[e].isAdmin){
                go = false;
                console.log(e);
            }
        })

        console.log(go);

        if(go){
            peer.pos = Position.Game;
            sendData(DataType.Start);
            UpdatePos();
        }
    }

    useEffect(() => {
        console.log(peer)

        setInterval(updateData, 1000);
    }, []);

    return (
      <div className='app'>
        <h1>Chat Room</h1>
        <h2>Lobby</h2>
        {peer.isAdmin ? <h2>Peer ID: {peer.peerID}</h2> : null}
        <br/>
        <br/>
        <h2>참여 인원</h2>
        <div>
            {peer.playerData ? Object.keys(peer.playerData).map((e) => {
            return <div>{peer.playerData[e].name}{!peer.playerData[e].isAdmin ? peer.playerData[e].isReady ? ", Ready": ", Not Ready" : null}</div>
        }): null}
        </div>
        <br/>
        <br/>
        <h2>Messages</h2>
        <div>
          {messages.map((msg) => (
            //@ts-ignore
            <p>{msg.sender}: {msg.content}</p>
          ))}
        </div>
        <input
          type='text'
          placeholder='Enter message'
          value={message}
          onChange={e => (setMessage(() => e.target.value))}
        />
        <button onClick={() => {sendData(DataType.Msg, {sender : peer.name, senderPeerId : peer.peerID, content : message});}}>Send</button>
        
        {!peer.isAdmin ? <button onClick={() => {sendData(DataType.Ready); setReady(!ready)}} style={{color: ready ? "Green" : "Red"}}>{ready ? "Ready" : "Not Ready"}</button> : null}
        {peer.isAdmin ? <button onClick={gameStart} style={{color: "Red"}}>Game Start</button>: null}
        {peer.conn.length ? !peer.conn[0].open ? <button onClick = {() => peer.connectPeer(peer.conn[0].peer)}>재접속</button> : null : null}
      </div>
    )
}

export default Lobby;