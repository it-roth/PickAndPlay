import App from './App';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import LocaleProvider from '../contexts/LocaleContext';

function AppWithProviders() {
  return (
    <AuthProvider>
      <CartProvider>
        <LocaleProvider>
          <App />
        </LocaleProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default AppWithProviders;