import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    waveWrap: {
        overflow: 'hidden',
        width: '85%',
        paddingHorizontal: 12,
        borderRadius: 12,
        paddingVertical: 6,
        alignItems: 'center',
    },
    btn: {
        borderRadius: 40,
        height: 40,
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconStyle: {
        height: 22,
        width: 22,
        resizeMode: 'contain',
    },
});

export default styles;