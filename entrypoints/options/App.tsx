import { Bot, KeyRound } from 'lucide-react';
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
        <SidebarHeader>
          <div className="px-2 py-1">
            <p className="font-semibold">FeelFill</p>
            <p className="text-xs text-muted-foreground">设置</p>
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
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger aria-label="切换设置导航" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">{content.title}</span>
        </header>

        <section aria-labelledby="settings-title" className="flex-1 p-8">
          <header className="mb-6">
            <h1 id="settings-title" className="text-2xl font-semibold">{content.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
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
