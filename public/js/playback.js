/**
 * 根据目标时间和直播回放数据计算B站回放URL
 * copilot太好用了你们知道吗
 * @param {string} targetDateTimeStr - 目标日期时间字符串 (e.g., "8.21 22:33" or "8.21 22:33:05")
 * @returns {Object} 包含success, message, details的对象。details在成功时包含url, p, t等信息。
 */
function getPlaybackURL(targetDateTimeStr) {
    const DEFAULT_YEAR = 2025;
    const dataList = [
        {
            "date": "8.18",
            "bvid": "BV1ABYbzdEma",
            "playbacks": [
                { "20:30:00": "2:00:11" },
                { "22:30:12": "1:26:26" }
            ]
        },
        {
            "date": "8.19",
            "bvid": "BV1teeAz4Ewb",
            "playbacks": [
                { "20:28:30": "2:00:11" },
                { "22:28:42": "2:00:13" },
                { "24:28:56": "0:53:01" }
            ]
        },
        {
            "date": "8.20",
            "bvid": "BV1BKeGziED4",
            "playbacks": [
                { "20:30:00": "2:00:12" },
                { "22:30:13": "1:45:31" }
            ]
        },
        {
            "date": "8.21",
            "bvid": "BV1JJYZzhE7a",
            "playbacks": [
                { "20:30:30": "2:00:11" },
                { "22:30:42": "1:36:33" }
            ]
        },
        {
            "date": "8.22",
            "bvid": "BV1keehzFEp8",
            "playbacks": [
                { "21:05:00": "2:00:11" },
                { "23:05:12": "0:53:22" }
            ]
        },
        {
            "date": "8.23",
            "bvid": "BV1AKezzHEyM",
            "playbacks": [
                { "20:01:00": "1:17:25" }
            ]
        },
        {
            "date": "8.23",
            "bvid": "BV1MReBzfEy8",
            "playbacks": [
                { "21:48:00": "2:00:10" },
                { "23:48:11": "0:57:55" }
            ]
        },
        {
            "date": "8.24",
            "bvid": "BV1sRepzCEBr",
            "playbacks": [
                { "19:54:30": "2:00:11" },
                { "21:54:42": "2:37:28" }
            ]
        },
        {
            "date": "8.25",
            "bvid": "BV1oQeZzaEDm",
            "playbacks": [
                { "20:33:00": "2:00:11" },
                { "22:33:12": "2:02:05" }
            ]
        },
        {
            "date": "8.26",
            "bvid": "BV1RVvTzJEnP",
            "playbacks": [
                { "20:29:00": "2:00:11" },
                { "22:29:12": "1:20:43" }
            ]
        },
    ];
    /**
     * 将 HH:mm:ss 或 HH:mm 格式的时间字符串转换为总秒数
     * @param {string} timeStr - 时间字符串
     * @returns {number} 总秒数
     */
    function timeStringToSeconds(timeStr) {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 3600 + parts[1] * 60;
        }
        return 0;
    }

    /**
     * 解析 MM.DD 格式的日期字符串，返回对应的 Date 对象（基于默认年份）
     * @param {string} dateStr - 日期字符串 (e.g., "8.21")
     * @returns {Date} 对应的 Date 对象
     */
    function parseDate(dateStr) {
        const [month, day] = dateStr.split('.').map(Number);
        // 注意：JavaScript Date 的月份是 0-indexed (0-11)
        return new Date(DEFAULT_YEAR, month - 1, day);
    }

    try {
        // --- 1. 解析输入 ---
        const dateTimeParts = targetDateTimeStr.trim().split(' ');
        if (dateTimeParts.length !== 2) {
            throw new Error("目标时间格式无效，请使用 'MM.DD HH:mm' 或 'MM.DD HH:mm:ss' 格式。");
        }
        const targetDateStr = dateTimeParts[0];
        const targetTimeStr = dateTimeParts[1];

        // --- 2. 验证并处理JSON数据列表 ---
        if (!Array.isArray(dataList) || dataList.length === 0) {
            throw new Error("JSON数据列表格式无效或为空。");
        }

        // --- 3. 计算目标时间戳 ---
        const targetDateObj = parseDate(targetDateStr);
        if (isNaN(targetDateObj.getTime())) {
            throw new Error(`无法解析目标日期: ${targetDateStr}`);
        }
        const [hours, minutes, seconds = 0] = targetTimeStr.split(':').map(Number);
        targetDateObj.setHours(hours, minutes, seconds, 0);
        const targetTimestamp = targetDateObj.getTime();

        // --- 4. 遍历数据列表，查找匹配的直播日期 ---
        for (const data of dataList) {
            if (!data || !data.date || !data.bvid || !Array.isArray(data.playbacks)) {
                // 跳过格式不正确的单个数据项
                continue;
            }

            // --- 5. 计算当前直播日期的时间戳 ---
            const liveDateObj = parseDate(data.date);
            if (isNaN(liveDateObj.getTime())) {
                // 跳过日期解析失败的项
                continue;
            }
            const liveStartOfDayTimestamp = liveDateObj.getTime();

            // --- 6. 处理当前直播日期的回放列表 ---
            const playbackList = data.playbacks.map((item, index) => {
                const startTimeStr = Object.keys(item)[0];
                const durationStr = Object.values(item)[0];
                return {
                    index: index + 1,
                    startTimeStr: startTimeStr,
                    durationStr: durationStr,
                    startSeconds: timeStringToSeconds(startTimeStr),
                    durationSeconds: timeStringToSeconds(durationStr)
                };
            });

            // --- 7. 查找目标时间对应的回放分P ---
            let foundPlayback = null;
            let elapsedSecondsInVideo = 0;

            for (const playback of playbackList) {
                const playbackStartTimestamp = liveStartOfDayTimestamp + (playback.startSeconds * 1000);
                const playbackEndTimestamp = playbackStartTimestamp + (playback.durationSeconds * 1000);

                if (targetTimestamp >= playbackStartTimestamp && targetTimestamp <= playbackEndTimestamp) {
                    foundPlayback = playback;
                    elapsedSecondsInVideo = Math.floor((targetTimestamp - playbackStartTimestamp) / 1000);
                    // 找到匹配项，跳出内层循环
                    break;
                }
            }

            // --- 8. 如果找到匹配项，则生成URL并返回 ---
            if (foundPlayback) {
                const url = `https://www.bilibili.com/video/${data.bvid}/?p=${foundPlayback.index}&t=${elapsedSecondsInVideo}`;
                return {
                    success: true,
                    message: `成功定位回放时间。`,
                    details: {
                        p: foundPlayback.index,
                        t: elapsedSecondsInVideo,
                        url: url,
                        bvid: data.bvid,
                        liveDate: data.date
                    }
                };
            }
            // 如果未找到，继续检查下一个直播日期
        }

        // --- 9. 如果遍历完所有数据都未找到匹配项 ---
        return {
            success: false,
            message: `未匹配到回放。 ${targetDateTimeStr}不在任何已知的直播回放时间段内。`,
            details: null
        };

    } catch (error) {
        return {
            success: false,
            message: `定位错误: ${error.message}`,
            details: null
        };
    }
}

// --- 示例用法 ---
/*
console.log(calculatePlaybackUrl("8.21 22:23"));
// 输出: {success: true, message: "找到匹配的回放分P (直播日期: 8.21)。", details: {p: 1, t: 6780, url: "https://www.bilibili.com/video/BV1ABYbzdEma/?p=1&t=6780", bvid: "BV1ABYbzdEma", liveDate: "8.21"}}

console.log(calculatePlaybackUrl("8.21 22:33"));
// 输出: {success: true, message: "找到匹配的回放分P (直播日期: 8.21)。", details: {p: 2, t: 168, url: "https://www.bilibili.com/video/BV1ABYbzdEma/?p=2&t=168", bvid: "BV1ABYbzdEma", liveDate: "8.21"}}

console.log(calculatePlaybackUrl("8.22 00:01"));
// 输出: {success: true, message: "找到匹配的回放分P (直播日期: 8.21)。", details: {p: 2, t: 5448, url: "https://www.bilibili.com/video/BV1ABYbzdEma/?p=2&t=5448", bvid: "BV1ABYbzdEma", liveDate: "8.21"}}

console.log(calculatePlaybackUrl("8.20 00:40"));
console.log(calculatePlaybackUrl("8.23 21:00"));
console.log(calculatePlaybackUrl("8.23 22:00"));

console.log(calculatePlaybackUrl("7.30 20:00"));
// 输出: {success: false, message: "未找到匹配的回放分P。目标时间 7.30 20:00 不在任何已知的直播回放时间段内。", details: null}

*/
function findPlaybackTimeStr(str) {
    const regex = /\b(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\b/;
    const match = str.match(regex);
    if (match) {
        return match[0];
    }
    return null; 
}

// 示例使用
/*
const text = "今天有个会议 8.21 20:00 开始，还有一次在 9.5 14:30:45。";
const result = findFirstDateTime(text);
console.log(result); // 输出: "8.21 20:00"
*/