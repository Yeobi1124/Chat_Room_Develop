import { useEffect, useState } from "react";
import { PeerData, Position } from "./PeerClass";

type props = {
    peer : PeerData
    UpdatePos : any
}

function Home({peer, UpdatePos} : props){
    const [name, setName] = useState('');
    const [remotePeerId, setRemotePeerId] = useState('');

    const GoLobby = (isAdmin : boolean) => {
        peer.name = name;
        peer.pos = Position.Lobby;
        peer.isAdmin = isAdmin;

        if(!isAdmin){
            peer.connectPeer(remotePeerId);
        }
        peer.playerData[peer.peerID] = {name : peer.name, peerId : peer.peerID, isReady : false, isAdmin : isAdmin};

        UpdatePos();
    }

    useEffect(() => {
        console.log(peer.peerID);
    }, [])

    return (
        <div className="home">
            <h1>Chat Room</h1>
            <h2>Set your name</h2>
            <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <br/>
            <button onClick={() => GoLobby(true)}>Make Room</button>
            <br/>
            <input
                type="text"
                placeholder="Enter remote id"
                value={remotePeerId}
                onChange={(e) => setRemotePeerId(e.target.value)}
            />
            <button onClick={() => GoLobby(false)}>Join Room</button>
        </div>
    );
}

export default Home