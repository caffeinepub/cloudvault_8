import { Button } from "@/components/ui/button";
import { CloudIcon, HardDrive, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function AuthScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <CloudIcon className="w-5 h-5" />
          </div>
          <span className="text-xl font-semibold">AuraDrive</span>
        </div>
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold leading-tight mb-6"
          >
            Your files, secure
            <br />
            and always accessible.
          </motion.h1>
          <div className="space-y-4">
            {[
              { icon: HardDrive, text: "2TB of secure cloud storage" },
              {
                icon: Shield,
                text: "End-to-end encrypted on the Internet Computer",
              },
              { icon: Zap, text: "Blazing-fast access from anywhere" },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-white/90 text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <p className="text-white/50 text-xs">
          © {new Date().getFullYear()} AuraDrive. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline hover:text-white/80"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <CloudIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold">AuraDrive</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome back
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Sign in to access your cloud storage.
          </p>
          <Button
            data-ocid="auth.primary_button"
            className="w-full h-11 text-sm font-medium"
            onClick={login}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign in with Internet Identity"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            New? Your account is created automatically on first sign-in.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
