import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import Titlebar from './components/Titlebar';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex flex-col h-screen">
          <Titlebar />
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;


// import React from 'react'

// function App() {
//   return (
//     <div className="flex items-center justify-center h-screen bg-gray-100">
//       <div className="text-2xl font-bold text-gray-800">App</div>
//     </div>
//   )
// }

// export default App