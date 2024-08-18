import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout1 from './layouts/Layout1';
import Main from './pages/Main';
import LandingPage from './pages/LandingPage';

function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout1 />}>
        <Route index element={<LandingPage />}/>
          <Route path='/main' element={<Main />}/>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
