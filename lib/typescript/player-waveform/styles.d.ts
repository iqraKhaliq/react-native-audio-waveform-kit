declare const styles: {
    outer: {
        marginVertical: number;
    };
    container: {
        borderRadius: number;
        paddingVertical: number;
        paddingHorizontal: number;
    };
    row: {
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "space-between";
    };
    playBtn: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
        justifyContent: "center";
        alignItems: "center";
        marginRight: number;
    };
    waveWrap: {
        position: "relative";
    };
    speedBtn: {
        marginLeft: number;
        paddingHorizontal: number;
        paddingVertical: number;
        borderRadius: number;
    };
    speedText: {
        fontSize: number;
        fontWeight: "600";
    };
    timeRow: {
        alignItems: "flex-end";
        marginTop: number;
    };
    timeText: {
        fontSize: number;
        fontWeight: "500";
    };
    scrubberDot: {
        position: "absolute";
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    scrubberDotDragging: {
        width: number;
        height: number;
        borderRadius: number;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    iconStyle: {
        height: number;
        width: number;
        resizeMode: "contain";
    };
};
export default styles;
//# sourceMappingURL=styles.d.ts.map