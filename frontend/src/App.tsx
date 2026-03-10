import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Biblioteca from './pages/Biblioteca';
import BuscarLivros from './pages/BuscarLivros';
import Wishlist from './pages/Wishlist';
import ProximasLeituras from './pages/ProximasLeituras';
import DetalhesLivro from './pages/DetalhesLivro';
import Estatisticas from './pages/Estatisticas';
import JaLidos from './pages/JaLidos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/buscar" element={<BuscarLivros />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/proximas" element={<ProximasLeituras />} />
          <Route path="/ja-lidos" element={<JaLidos />} />
          <Route path="/livro/:id" element={<DetalhesLivro />} />
          <Route path="/estatisticas" element={<Estatisticas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
