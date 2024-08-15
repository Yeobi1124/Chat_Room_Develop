import { useState, useEffect, useRef } from 'react';
import './App.css';
import Home from './Home.tsx';
import Lobby from './Lobby.tsx';
import { PeerData, Position } from './PeerClass.ts';

function App() {
  const peer = useRef(new PeerData());
  const [pos, setPos] = useState(Position.Home);

  useEffect(() => {
    window.addEventListener('beforeunload', () => {
      peer.current.conn.forEach(conn => {
        conn.close();
      })
    })
  })

  function UpdatePos() : void{
    setPos(() => peer.current.pos);
  }

  return (
    <div className='app'>
      {pos===Position.Home ? <Home peer={peer.current} UpdatePos={UpdatePos}/> : null}
      {pos===Position.Lobby ? <Lobby peer={peer.current} UpdatePos={UpdatePos}/> : null}
      {pos===Position.Game ? <h1>Game Part</h1> : null}
      <br/>
      <button onClick={() => {console.log(peer.current)}}>Peer 확인</button>
      <button onClick={() => {console.log(pos)}}>Pos 확인</button>
    </div>
  )
}

export default App
