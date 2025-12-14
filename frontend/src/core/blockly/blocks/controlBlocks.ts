import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import { setBlockSemanticData } from "../serialization/metadataManager";
import * as BlockIDs from "../constants/blockIds";
import * as BlockComponents from "../ui/blockComponents"
import { validateControlCardinality } from "../validation/cardinalityValidator";
import { renderBlockWarnings } from "../validation/validationWarnings";
import { addLocalChangeListener } from "../events/blockEventListeners";

export function createControlBlock(controlDefinition: CLI.CLIControl): void {
    Blockly.Blocks[BlockIDs.controlBlockType(controlDefinition)] = {
        init: function(this: Blockly.BlockSvg) {
            setBlockSemanticData(this, {
                nodeType: "control",
                commandName: controlDefinition.id,
            });

            appendControlHeader(controlDefinition, this);
            appendControlSlots(controlDefinition, this);
            setupControlConnections(controlDefinition, this);
            setupControlValidation(controlDefinition, this);
        },
    };
}

function appendControlHeader(
    controlDefinition: CLI.CLIControl,
    block: Blockly.BlockSvg,
): void {
    const helpIcon = BlockComponents.createGenericHelpIcon(() => {
        return `
            <div class="help-content">
                <h3>Controle: ${controlDefinition.label}</h3>
                <p>${controlDefinition.description}</p>
                <small>Sintaxe: ${controlDefinition.label} ... ${controlDefinition.syntaxEnd}</small>
            </div>
        `;
    });

    block
        .appendDummyInput()
        .appendField(controlDefinition.label)
        .appendField(" ")
        .appendField(helpIcon);
}

function appendControlSlots(
    controlDefinition: CLI.CLIControl,
    block: Blockly.BlockSvg,
): void {
    controlDefinition.slots.forEach((slot) => {
        const input = block
            .appendStatementInput(slot.name)
            .setCheck(slot.check);
        if (slot.label) input.appendField(slot.label);
    });
}

function setupControlConnections(
    controlDefinition: CLI.CLIControl,
    block: Blockly.BlockSvg,
): void {
    block.setPreviousStatement(true, BlockIDs.commandStatementType());
    block.setNextStatement(true, BlockIDs.commandStatementType());
    block.setColour(controlDefinition.color);
    block.setTooltip(controlDefinition.description);
}

function setupControlValidation(
    controlDefinition: CLI.CLIControl,
    block: Blockly.BlockSvg,
): void {
    addLocalChangeListener(block, () => {
        validateControlCardinality(block, controlDefinition);
        renderBlockWarnings(block);
    });
}
