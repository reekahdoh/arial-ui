import { WelcomeAuthCard } from './WelcomeAuthCard';
import { WelcomeAuthLoadingScreen, WelcomeAuthPageLayout } from './WelcomeAuthPageLayout';
import { useWelcomeAuthPage } from './useWelcomeAuthPage';

export function WelcomeAuthPage() {
  const auth = useWelcomeAuthPage();

  if (auth.loading) return <WelcomeAuthLoadingScreen />;

  return (
    <WelcomeAuthPageLayout
      configured={auth.configured}
      formError={auth.formError}
      onDismissError={() => auth.setFormError(null)}
    >
      <WelcomeAuthCard
        tab={auth.tab}
        onTabChange={auth.setTab}
        configured={auth.configured}
        submitting={auth.submitting}
        signInForm={auth.signInForm}
        registerForm={auth.registerForm}
        onSignIn={auth.onSignIn}
        onRegister={auth.onRegister}
        onGoogleSignIn={() => void auth.onGoogleSignIn()}
      />
    </WelcomeAuthPageLayout>
  );
}
