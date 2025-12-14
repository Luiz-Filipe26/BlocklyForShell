import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import * as BlockIDs from "../constants/blockIds";
import { setBlockSemanticData } from "../serialization/metadataManager";
import * as BlockComponents from "../ui/blockComponents";
import { validateOperatorIntegrity } from "../validation/cardinalityValidator";
import { renderBlockWarnings } from "../validation/validationWarnings";
import { addLocalChangeListener } from "../events/blockEventListeners";

export function createOperatorBlock(operatorDefinition: CLI.CLIOperator): void {
    Blockly.Blocks[BlockIDs.operatorBlockType(operatorDefinition)] = {
        init: function(this: Blockly.BlockSvg) {
            setBlockSemanticData(this, {
                nodeType: "operator",
                commandName: operatorDefinition.id,
                slotsWithImplicitData: operatorDefinition.slotsWithImplicitData,
            });

            this.setInputsInline(true);

            appendOperatorHeader(operatorDefinition, this);
            appendOperatorSlots(operatorDefinition, this);
            setupOperatorConnections(operatorDefinition, this);
            setupOperatorValidation(operatorDefinition, this);
        },
    };
}

function appendOperatorHeader(
    operatorDefinition: CLI.CLIOperator,
    block: Blockly.BlockSvg,
): void {
    const helpIcon = BlockComponents.createGenericHelpIcon(() => {
        return `
            <div class="help-content">
                <h3>Operador: ${operatorDefinition.label}</h3>
                <p>${operatorDefinition.description}</p>
            </div>
        `;
    });

    block
        .appendDummyInput()
        .appendField(operatorDefinition.label)
        .appendField(" ")
        .appendField(helpIcon);
}

function appendOperatorSlots(
    operatorDefinition: CLI.CLIOperator,
    block: Blockly.BlockSvg,
): void {
    operatorDefinition.slots.forEach((slot) => {
        const input = block
            .appendStatementInput(slot.name)
            .setCheck(slot.check);

        if (slot.symbol) {
            if (slot.symbolPlacement === "before") {
                input.appendField(slot.symbol);
                if (slot.label) input.appendField(slot.label);
            } else {
                if (slot.label) input.appendField(slot.label);
            }
        } else if (slot.label) {
            input.appendField(slot.label);
        }
    });
}

function setupOperatorConnections(
    operatorDefinition: CLI.CLIOperator,
    block: Blockly.BlockSvg,
): void {
    block.setPreviousStatement(true, BlockIDs.commandStatementType());
    block.setNextStatement(true, BlockIDs.commandStatementType());
    block.setColour(operatorDefinition.color);
    block.setTooltip(operatorDefinition.description);
}

function setupOperatorValidation(
    operatorDefinition: CLI.CLIOperator,
    block: Blockly.BlockSvg,
): void {
    addLocalChangeListener(block, () => {
        validateOperatorIntegrity(block, operatorDefinition);
        renderBlockWarnings(block);
    });
}
