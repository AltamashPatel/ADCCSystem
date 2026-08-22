import { BrowserRouter } from 'react-router-dom';
import { SystemProvider } from './contexts/SystemContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes/AppRoutes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SystemProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SystemProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
