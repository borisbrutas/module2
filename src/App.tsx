import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import CreateAccount from './Components/CreateAccount';
import { Container, Stack } from '@mui/system';

function App() {
  return (
    // <div className="App">
    //   <CreateAccount />
    // </div>
    <Container maxWidth="lg">
      <Stack spacing={2} direction="column">
          <CreateAccount />      
      </Stack>
    </Container>
  );
}

export default App;
