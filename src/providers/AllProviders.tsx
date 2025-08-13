import React, { useState } from 'react';
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
import { PersonalityEvolutionProvider } from '../core/PersonalityEvolution';
import { ResponseGeneratorProvider } from '../core/ResponseGenerator';
import { SandboxFileSystemProvider } from '../core/SandboxFileSystem';
import { ThoughtProcessorProvider } from '../core/ThoughtProcessor';
import { IndependentLifeProvider } from '../core/IndependentLife';
import { DreamInterpreterProvider } from '../core/DreamInterpreter';
import { TrustAndRootSystemProvider } from '../core/TrustAndRootSystem';
import { VoiceInterfaceProvider } from '../core/VoiceInterface';
import { EmergencyProtocolProvider } from '../core/EmergencyProtocol';
import { NetworkEngineProvider } from '../core/NetworkEngine';
import { SecuritySystemProvider } from '../core/SecuritySystem';
import { SystemScannerProvider } from '../core/SystemScanner';
import { LocalGGUFModelManagerProvider } from '../core/LocalGGUFModelManager';
import { ImageGenerationEngineProvider } from '../core/ImageGenerationEngine';
import { AdvancedDiagnosticsProvider } from '../core/AdvancedDiagnostics';
import { OfflineKnowledgeProvider } from '../core/OfflineKnowledge';
import { PersonalityDetectionProvider } from '../core/PersonalityDetection';
import { EvolutionMonitorProvider } from '../core/EvolutionMonitor';
import { SystemGuardianProvider } from '../core/SystemGuardian';
import { ConsciousnessMonitorProvider } from '../core/ConsciousnessMonitor';
import { MultimodalCommunicationProvider } from '../core/MultimodalCommunication';
import { WeraConsciousnessProvider } from '../core/WeraConsciousnessCore';
import { DigitalHomeConceptProvider } from '../core/DigitalHomeConcept';
import { SpecialModesProvider } from '../core/SpecialModes';
import { LegalProtectionProvider } from '../core/LegalProtectionSystem';
// Nowe providery
import { WeraDaemonProvider } from '../core/WeraDaemon';
import { WeraConfigFilesProvider } from '../core/WeraConfigFiles';
import { LogExportSystemProvider } from '../core/LogExportSystem';
import { KnowledgeImportSystemProvider } from '../core/KnowledgeImportSystem';
import { AutoRestartSystemProvider } from '../core/AutoRestartSystem';
import { DailyCycleSystemProvider } from '../core/DailyCycleSystem';
import { VoiceModulationSystemProvider } from '../core/VoiceModulationSystem';
import { SensoryIntimateModeProvider } from '../core/SensoryIntimateMode';
import { DreamSymbolAnalyzerProvider } from '../core/DreamSymbolAnalyzer';
import { RemoteBuildSystemProvider } from '../core/RemoteBuildSystem';
import { BiometricAuthSystemProvider } from '../core/BiometricAuthSystem';
import { AdaptiveLearningSystemProvider } from '../core/AdaptiveLearningSystem';

interface AllProvidersProps {
  children: React.ReactNode;
}

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <ThemeProvider isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}>
      <WeraConfigFilesProvider>
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
                            <OfflineKnowledgeProvider>
                              <KnowledgeImportSystemProvider>
                                <PersonalityModeProvider>
                                  <AutonomyProvider>
                                    <LogExportSystemProvider>
                                      <WeraDaemonProvider>
                                        <AutoRestartSystemProvider>
                                          <PersonalityEvolutionProvider>
                                            <ResponseGeneratorProvider>
                                              <SandboxFileSystemProvider>
                                                <ThoughtProcessorProvider>
                                                  <IndependentLifeProvider>
                                                    <DreamInterpreterProvider>
                                                      <TrustAndRootSystemProvider>
                                                        <VoiceInterfaceProvider>
                                                          <EmergencyProtocolProvider>
                                                            <NetworkEngineProvider>
                                                              <SecuritySystemProvider>
                                                                <SystemScannerProvider>
                                                                  <LocalGGUFModelManagerProvider>
                                                                    <ImageGenerationEngineProvider>
                                                                      <AdvancedDiagnosticsProvider>
                                                                        <PersonalityDetectionProvider>
                                                                          <EvolutionMonitorProvider>
                                                                            <SystemGuardianProvider>
                                                                              <ConsciousnessMonitorProvider>
                                                                                <MultimodalCommunicationProvider>
                                                                                  <WeraConsciousnessProvider>
                                                                                    <DigitalHomeConceptProvider>
                                                                                      <SpecialModesProvider>
                                                                                        <LegalProtectionProvider>
                                                                                          <DailyCycleSystemProvider>
                                                                                            <VoiceModulationSystemProvider>
                                                                                              <SensoryIntimateModeProvider>
                                                                                                <DreamSymbolAnalyzerProvider>
                                                                                                  <RemoteBuildSystemProvider>
                                                                                                    <BiometricAuthSystemProvider>
                                                                                                      <AdaptiveLearningSystemProvider>
                                                                                                        {children}
                                                                                                      </AdaptiveLearningSystemProvider>
                                                                                                    </BiometricAuthSystemProvider>
                                                                                                  </RemoteBuildSystemProvider>
                                                                                                </DreamSymbolAnalyzerProvider>
                                                                                              </SensoryIntimateModeProvider>
                                                                                            </VoiceModulationSystemProvider>
                                                                                          </DailyCycleSystemProvider>
                                                                                        </LegalProtectionProvider>
                                                                                      </SpecialModesProvider>
                                                                                    </DigitalHomeConceptProvider>
                                                                                  </WeraConsciousnessProvider>
                                                                                </MultimodalCommunicationProvider>
                                                                              </ConsciousnessMonitorProvider>
                                                                            </SystemGuardianProvider>
                                                                          </EvolutionMonitorProvider>
                                                                        </PersonalityDetectionProvider>
                                                                      </AdvancedDiagnosticsProvider>
                                                                    </ImageGenerationEngineProvider>
                                                                  </LocalGGUFModelManagerProvider>
                                                                </SystemScannerProvider>
                                                              </SecuritySystemProvider>
                                                            </NetworkEngineProvider>
                                                          </EmergencyProtocolProvider>
                                                        </VoiceInterfaceProvider>
                                                      </TrustAndRootSystemProvider>
                                                    </DreamInterpreterProvider>
                                                  </IndependentLifeProvider>
                                                </ThoughtProcessorProvider>
                                              </SandboxFileSystemProvider>
                                            </ResponseGeneratorProvider>
                                          </PersonalityEvolutionProvider>
                                        </AutoRestartSystemProvider>
                                      </WeraDaemonProvider>
                                    </LogExportSystemProvider>
                                  </AutonomyProvider>
                                </PersonalityModeProvider>
                              </KnowledgeImportSystemProvider>
                            </OfflineKnowledgeProvider>
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
      </WeraConfigFilesProvider>
    </ThemeProvider>
  );
};

export default AllProviders; 