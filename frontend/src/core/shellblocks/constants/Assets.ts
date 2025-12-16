import transparent from "../assets/icons/transparent.svg";
import cardinality from "../assets/icons/cardinality-icon.svg";
import info from "../assets/icons/info-icon.svg";
import fileTextWhite from "../assets/icons/file-text-white.svg";
import alertYellow from "../assets/icons/triangle-alert-yellow.svg";
import errorRed from "../assets/icons/octagon-x-red.svg";

export const Assets = {
    Icons: {
        Empty: transparent,
        CardinalityError: cardinality,
        Info: info,
        FileText: fileTextWhite,
        Warning: alertYellow,
        Error: errorRed
    }
} as const;
