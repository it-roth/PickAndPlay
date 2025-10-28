import App from './App';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import LocaleProvider from '../contexts/LocaleContext';
import GlobalToast from '../components/GlobalToast';

function AppWithProviders() {
  return (
    <AuthProvider>
      <CartProvider>
        <LocaleProvider>
          <App />
          <GlobalToast />
        </LocaleProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default AppWithProviders;