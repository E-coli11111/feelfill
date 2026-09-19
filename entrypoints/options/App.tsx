import { Bot, KeyRound, Sparkles } from 'lucide-react';
import { useState } from 'react';
import AuthPanel from '@/src/components/auth';
import ModelPanel from '@/src/components/model';
import { Separator } from '@/src/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/src/components/ui/sidebar';

type SettingsSection = 'authentication' | 'model';

const SETTINGS_ITEMS: ReadonlyArray<{
  id: SettingsSection;
  label: string;
  icon: typeof KeyRound;
}> = [
  { id: 'authentication', label: '鉴权', icon: KeyRound },
  { id: 'model', label: '模型', icon: Bot },
];

const SECTION_CONTENT: Record<SettingsSection, {
  title: string;
  description: string;
}> = {
  authentication: {
    title: '鉴权',
    description: '管理模型服务的登录与授权状态。',
  },
  model: {
    title: '模型',
    description: '选择 FeelFill 用于字段识别和文档提取的模型。',
  },
};

export default function App() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('authentication');
  const content = SECTION_CONTENT[activeSection];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b py-5">
          <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:px-0">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles aria-hidden="true" className="size-4" />
            </span>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-lg font-semibold tracking-tight">FeelFill</p>
              <p className="text-xs text-muted-foreground">让填写更轻松</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>设置</SidebarGroupLabel>
            <SidebarGroupContent>
              <nav aria-label="设置导航">
                <SidebarMenu>
                  {SETTINGS_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        type="button"
                        isActive={activeSection === item.id}
                        aria-current={activeSection === item.id ? 'page' : undefined}
                        tooltip={item.label}
                        className="h-11 rounded-md data-[active=true]:text-primary"
                        onClick={() => setActiveSection(item.id)}
                      >
                        <item.icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </nav>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 items-center gap-3 border-b bg-card/70 px-4 sm:px-6">
          <SidebarTrigger aria-label="切换设置导航" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">设置</span>
          <span aria-hidden="true" className="text-border">/</span>
          <span className="text-sm font-medium">{content.title}</span>
        </header>

        <section aria-labelledby="settings-title" className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-10 sm:py-12">
          <header className="mb-8">
            <p className="mb-3 text-xs font-medium tracking-widest text-primary">FEELFILL / 偏好设置</p>
            <h1 id="settings-title" className="text-3xl font-semibold tracking-tight">{content.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {content.description}
            </p>
          </header>

          {activeSection === 'authentication'
            ? <AuthPanel />
            : <ModelPanel onRequestAuthentication={() => setActiveSection('authentication')} />}
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}
