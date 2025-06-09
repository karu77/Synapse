import { XMarkIcon } from '@heroicons/react/24/outline'
import CustomizationPanel from './CustomizationPanel'
import HistoryPanel from './HistoryPanel'
import NodeInfoPanel from './NodeInfoPanel'
import StyleCustomizationPanel from './StyleCustomizationPanel'
import TextInput from './TextInput'

const ControlSidebar = ({
  isOpen,
  onClose,
  onSubmit,
  isProcessing,
  selectedNode,
  history,
  loadFromHistory,
  handleDeleteFromHistory,
  clearHistory,
  styleOptions,
  setStyleOptions,
  resetStyles,
  physicsOptions,
  setPhysicsOptions,
  resetPhysics,
}) => {
  return (
    <>
      {/* Overlay for mobile/tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        ></div>
      )}
      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 h-full bg-skin-bg shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-full max-w-md overflow-y-auto border-r border-skin-border`}
      >
        <div className="p-6 md:p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-skin-text">Synapse Controls</h2>
            <button onClick={onClose} className="p-1 rounded-full text-skin-text-muted hover:bg-skin-border hover:text-skin-text">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="overflow-y-auto flex-grow pr-4 -mr-4">
            <TextInput onSubmit={onSubmit} isProcessing={isProcessing} />
            <NodeInfoPanel node={selectedNode} />
            <HistoryPanel
              history={history}
              onSelect={loadFromHistory}
              onDelete={handleDeleteFromHistory}
              onClear={clearHistory}
            />
            <StyleCustomizationPanel
              options={styleOptions}
              onUpdate={setStyleOptions}
              onReset={resetStyles}
            />
            <CustomizationPanel
              options={physicsOptions}
              onUpdate={setPhysicsOptions}
              onReset={resetPhysics}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default ControlSidebar 