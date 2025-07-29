import React from 'react';
import { ThemeProvider } from '../theme/ThemeContext';
import { WeraCoreProvider } from '../core/WeraCore';
import { EmotionEngineProvider } from '../core/EmotionEngine';
import { MemoryProvider } from '../contexts/MemoryContext';
import { DeviceProvider } from '../core/DeviceContext';
import { DiagnosticsProvider } from '../core/DiagnosticsEngine';
import { NotificationProvider } from '../core/NotificationEngine';
import { ConversationProvider } from '../core/ConversationEngine';
import { PromptProvider } from '../core/PromptEngine';
import { EvolutionProvider } from '../core/EvolutionEngine';
import { KnowledgeProvider } from '../core/KnowledgeEngine';
import { PersonalityModeProvider } from '../core/PersonalityModeEngine';
import { AutonomyProvider } from '../core/AutonomySystem';
import { AdvancedDiagnosticsProvider } from '../core/AdvancedDiagnostics';
import { SecuritySystemProvider } from '../core/SecuritySystem';
import { InternalLifeReadinessProvider } from '../core/InternalLifeReadiness';
import { AdvancedAIModelsProvider } from '../core/AdvancedAIModels';
import { TrustAndRootProvider } from '../core/TrustAndRootSystem';
import { VoiceInterfaceProvider } from '../core/VoiceInterface';
import { WeraConsciousnessProvider } from '../core/WeraConsciousnessCore';
import { NetworkEngineProvider } from '../core/NetworkEngine';
import { SandboxFileSystemProvider } from '../core/SandboxFileSystem';
import { DreamInterpreterProvider } from '../core/DreamInterpreter';
import { SpecialModesProvider } from '../core/SpecialModes';
import { SystemGuardianProvider } from '../core/SystemGuardian';
import { AutonomyEngineProvider } from '../core/AutonomyEngine';
import { ConsciousnessMonitorProvider } from '../core/ConsciousnessMonitor';
import { LocalGGUFModelManagerProvider } from '../core/LocalGGUFModelManager';
import { ImageGenerationEngineProvider } from '../core/ImageGenerationEngine';

interface AllProvidersProps {
  children: React.ReactNode;
}

export const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <WeraCoreProvider>
        <EmotionEngineProvider>
          <MemoryProvider>
            <DeviceProvider>
              <DiagnosticsProvider>
                <NotificationProvider>
                  <ConversationProvider>
                    <PromptProvider>
                      <EvolutionProvider>
                        <KnowledgeProvider>
                          <PersonalityModeProvider>
                            <AutonomyProvider>
                              <AdvancedDiagnosticsProvider>
                                <SecuritySystemProvider>
                                  <InternalLifeReadinessProvider>
                                    <AdvancedAIModelsProvider>
                                      <TrustAndRootProvider>
                                        <VoiceInterfaceProvider>
                                          <WeraConsciousnessProvider>
                                            <NetworkEngineProvider>
                                              <SandboxFileSystemProvider>
                                                <DreamInterpreterProvider>
                                                  <SpecialModesProvider>
                                                    <SystemGuardianProvider>
                                                      <AutonomyEngineProvider>
                                                        <ConsciousnessMonitorProvider>
                                                          <LocalGGUFModelManagerProvider>
                                                            <ImageGenerationEngineProvider>
                                                              {children}
                                                            </ImageGenerationEngineProvider>
                                                          </LocalGGUFModelManagerProvider>
                                                        </ConsciousnessMonitorProvider>
                                                      </AutonomyEngineProvider>
                                                    </SystemGuardianProvider>
                                                  </SpecialModesProvider>
                                                </DreamInterpreterProvider>
                                              </SandboxFileSystemProvider>
                                            </NetworkEngineProvider>
                                          </WeraConsciousnessProvider>
                                        </VoiceInterfaceProvider>
                                      </TrustAndRootProvider>
                                    </AdvancedAIModelsProvider>
                                  </InternalLifeReadinessProvider>
                                </SecuritySystemProvider>
                              </AdvancedDiagnosticsProvider>
                            </AutonomyProvider>
                          </PersonalityModeProvider>
                        </KnowledgeProvider>
                      </EvolutionProvider>
                    </PromptProvider>
                  </ConversationProvider>
                </NotificationProvider>
              </DiagnosticsProvider>
            </DeviceProvider>
          </MemoryProvider>
        </EmotionEngineProvider>
      </WeraCoreProvider>
    </ThemeProvider>
  );
}; 