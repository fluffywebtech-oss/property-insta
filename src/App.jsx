import { lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import { ToastProvider } from './hooks/useToast';

// Eager: the bits that are always on the initial render
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import FeedView from './components/FeedView';
import FilterSidebar from './components/FilterSidebar';
import Footer, { MobileNav, ChatWidget } from './components/Footer';
import './styles/styles.scss';

// Lazy: every secondary view + all 17 OS modules + the modal stack.
// Cuts the initial JS bundle to roughly the feed-only experience and
// streams in everything else on demand.
const BuilderView        = lazy(() => import('./components/BuilderView'));
const ReelsView          = lazy(() => import('./components/ReelsView'));
const MapView            = lazy(() => import('./components/MapView'));
const SavedView          = lazy(() => import('./components/SavedView'));
const BlogView           = lazy(() => import('./components/BlogView'));
const Modals             = lazy(() => import('./components/Modals'));
const OSDashboard        = lazy(() => import('./components/os/OSDashboard'));
const TrustLayer         = lazy(() => import('./components/os/TrustLayer'));
const PropertyPassport   = lazy(() => import('./components/os/PropertyPassport'));
const TransactionLayer   = lazy(() => import('./components/os/TransactionLayer'));
const CRMView            = lazy(() => import('./components/os/CRMView'));
const ChannelPartnerView = lazy(() => import('./components/os/ChannelPartnerView'));
const AICopilotView      = lazy(() => import('./components/os/AICopilotView'));
const FinancingView      = lazy(() => import('./components/os/FinancingView'));
const LegalView          = lazy(() => import('./components/os/LegalView'));
const InfraView          = lazy(() => import('./components/os/InfraView'));
const DataCloudView      = lazy(() => import('./components/os/DataCloudView'));
const InvestmentView     = lazy(() => import('./components/os/InvestmentView'));
const RentalView         = lazy(() => import('./components/os/RentalView'));
const LocalCommerceView  = lazy(() => import('./components/os/LocalCommerceView'));
const SocialView         = lazy(() => import('./components/os/SocialView'));
const GovIntView         = lazy(() => import('./components/os/GovIntView'));
const AIExchangeView     = lazy(() => import('./components/os/AIExchangeView'));

// Lightweight loading skeleton shown while a lazy chunk streams in.
function ViewLoader() {
  return (
    <div className="app-view-loader" aria-busy="true">
      <div className="app-view-loader-spinner" />
      <span>Loading…</span>
    </div>
  );
}

function AppLayout() {
  const { currentView, darkMode } = useApp();

  const renderView = () => {
    switch (currentView) {
      case 'feed':
        return (
          <div className="ig-main-layout">
            <FilterSidebar />
            <main className="ig-feed">
              <FeedView />
            </main>
          </div>
        );
      case 'builder': return <BuilderView />;
      case 'reels': return <ReelsView />;
      case 'mapView': return <MapView />;
      case 'saved': return <SavedView />;
      case 'blog': return <BlogView />;
      // OS Modules
      case 'os': return <div className="os-page-wrap"><OSDashboard /></div>;
      case 'trust': return <div className="os-page-wrap"><TrustLayer /></div>;
      case 'passport': return <div className="os-page-wrap"><PropertyPassport /></div>;
      case 'transaction': return <div className="os-page-wrap"><TransactionLayer /></div>;
      case 'crm': return <div className="os-page-wrap"><CRMView /></div>;
      case 'channelpartner': return <div className="os-page-wrap"><ChannelPartnerView /></div>;
      case 'copilot': return <div className="os-page-wrap"><AICopilotView /></div>;
      case 'financing': return <div className="os-page-wrap"><FinancingView /></div>;
      case 'legal': return <div className="os-page-wrap"><LegalView /></div>;
      case 'infra': return <div className="os-page-wrap"><InfraView /></div>;
      case 'datacloud': return <div className="os-page-wrap"><DataCloudView /></div>;
      case 'investment': return <div className="os-page-wrap"><InvestmentView /></div>;
      case 'rental': return <div className="os-page-wrap"><RentalView /></div>;
      case 'commerce': return <div className="os-page-wrap"><LocalCommerceView /></div>;
      case 'social': return <div className="os-page-wrap"><SocialView /></div>;
      case 'govint': return <div className="os-page-wrap"><GovIntView /></div>;
      case 'aiexchange': return <div className="os-page-wrap"><AIExchangeView /></div>;
      default:
        return (
          <div className="ig-main-layout">
            <FilterSidebar />
            <main className="ig-feed">
              <FeedView />
            </main>
          </div>
        );
    }
  };

  const isOsView = !['feed', 'reels', 'mapView', 'saved', 'blog', 'builder'].includes(currentView);

  return (
    <div className={`app-root ${darkMode ? 'dark' : ''}`}>
      <Header />
      {currentView === 'feed' && <HeroBanner />}
      <Suspense fallback={<ViewLoader />}>
        {renderView()}
      </Suspense>
      {!isOsView && <Footer />}
      <MobileNav />
      <ChatWidget />
      <Suspense fallback={null}>
        <Modals />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <AppProvider>
          <ToastProvider>
            <AppLayout />
          </ToastProvider>
        </AppProvider>
      </RoleProvider>
    </AuthProvider>
  );
}
