from lib import *

def sec(heading, first, second, *keys):
    return {"h": heading, "paragraphs": [first, second], "cites": cites(*keys)}


def ladder(title, parties, rows):
    return flow(title, parties, [hop(*row) for row in rows])


def make_lab(title, kind, prompt, steps, question, choices, index, why, cite, **extra):
    row = {
        "title": title,
        "kind": kind,
        "prompt": prompt,
        "steps": steps,
        "check": check(question, choices, index, why, cite),
    }
    row.update(extra)
    return row


def make_fault(title, symptom, log, choices, answer, why, cause, fix, *keys):
    return {
        "title": title,
        "symptom": symptom,
        "log": log,
        "choices": choices,
        "answer": answer,
        "why": why,
        "cause": cause,
        "fix": fix,
        "cites": cites(*keys),
    }


OFFER_TWO = (
    "v=0\n"
    f"o=alice 2890844526 2890844526 IN IP4 {ALICE}\n"
    "s=-\n"
    f"c=IN IP4 {ALICE}\n"
    "t=0 0\n"
    "m=audio 49170 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=sendrecv\n"
    "m=audio 49172 RTP/AVP 8\n"
    "a=rtpmap:8 PCMA/8000\n"
    "a=sendrecv\n"
)

ANSWER_TWO = (
    "v=0\n"
    f"o=bob 20 20 IN IP4 {CARRIER}\n"
    "s=-\n"
    f"c=IN IP4 {CARRIER}\n"
    "t=0 0\n"
    "m=audio 40000 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=sendrecv\n"
    "m=audio 0 RTP/AVP 8\n"
    "a=rtpmap:8 PCMA/8000\n"
    "a=sendrecv\n"
)

OFFER_RTPMAP = (
    "v=0\n"
    f"o=alice 2890844526 2890844527 IN IP4 {ALICE}\n"
    "s=-\n"
    f"c=IN IP4 {ALICE}\n"
    "t=0 0\n"
    "m=audio 49170 RTP/AVP 96 9\n"
    "a=rtpmap:96 opus/48000/2\n"
    "a=fmtp:96 useinbandfec=1\n"
    "a=rtpmap:9 G722/8000\n"
    "a=sendrecv\n"
)

ANSWER_RTPMAP = (
    "v=0\n"
    f"o=bob 21 21 IN IP4 {CARRIER}\n"
    "s=-\n"
    f"c=IN IP4 {CARRIER}\n"
    "t=0 0\n"
    "m=audio 40010 RTP/AVP 111 9\n"
    "a=rtpmap:111 opus/48000/2\n"
    "a=fmtp:111 useinbandfec=1\n"
    "a=rtpmap:9 G722/8000\n"
    "a=sendrecv\n"
)

OFFER_HOLD = (
    "v=0\n"
    f"o=alice 2890844526 2890844528 IN IP4 {ALICE}\n"
    "s=-\n"
    f"c=IN IP4 {ALICE}\n"
    "t=0 0\n"
    "m=audio 49170 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=sendonly\n"
)

ANSWER_HOLD = (
    "v=0\n"
    f"o=bob 22 22 IN IP4 {CARRIER}\n"
    "s=-\n"
    f"c=IN IP4 {CARRIER}\n"
    "t=0 0\n"
    "m=audio 40000 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=recvonly\n"
)

OFFER_PORT0 = (
    "v=0\n"
    f"o=alice 30 30 IN IP4 {ALICE}\n"
    "s=-\n"
    f"c=IN IP4 {ALICE}\n"
    "t=0 0\n"
    "m=audio 49170 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=sendrecv\n"
    "m=audio 49174 RTP/AVP 8\n"
    "a=rtpmap:8 PCMA/8000\n"
    "a=sendrecv\n"
)

ANSWER_PORT0 = (
    "v=0\n"
    f"o=bob 31 31 IN IP4 {CARRIER}\n"
    "s=-\n"
    f"c=IN IP4 {CARRIER}\n"
    "t=0 0\n"
    "m=audio 41000 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=sendrecv\n"
    "m=audio 0 RTP/AVP 8\n"
    "a=rtpmap:8 PCMA/8000\n"
)

EARLY_SDP = (
    "v=0\n"
    f"o=bob 40 40 IN IP4 {CARRIER}\n"
    "s=-\n"
    f"c=IN IP4 {CARRIER}\n"
    "t=0 0\n"
    "m=audio 40002 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=sendrecv\n"
)

FINAL_SDP = (
    "v=0\n"
    f"o=bob 40 41 IN IP4 {CARRIER}\n"
    "s=-\n"
    f"c=IN IP4 {CARRIER}\n"
    "t=0 0\n"
    "m=audio 40008 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=sendrecv\n"
)

OFFER_DTMF = (
    "v=0\n"
    f"o=alice 50 50 IN IP4 {ALICE}\n"
    "s=-\n"
    f"c=IN IP4 {ALICE}\n"
    "t=0 0\n"
    "m=audio 49170 RTP/AVP 0 101\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=rtpmap:101 telephone-event/8000\n"
    "a=fmtp:101 0-15\n"
    "a=ptime:20\n"
    "a=sendrecv\n"
)

ANSWER_DTMF = (
    "v=0\n"
    f"o=bob 51 51 IN IP4 {CARRIER}\n"
    "s=-\n"
    f"c=IN IP4 {CARRIER}\n"
    "t=0 0\n"
    "m=audio 40020 RTP/AVP 0 106\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=rtpmap:106 telephone-event/8000\n"
    "a=fmtp:106 0-15\n"
    "a=ptime:20\n"
    "a=sendrecv\n"
)

OFFER_PTIME = (
    "v=0\n"
    f"o=alice 60 60 IN IP4 {ALICE}\n"
    "s=-\n"
    f"c=IN IP4 {ALICE}\n"
    "t=0 0\n"
    "m=audio 49170 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=ptime:20\n"
    "a=sendrecv\n"
)

ANSWER_PTIME = (
    "v=0\n"
    f"o=bob 61 61 IN IP4 {CARRIER}\n"
    "s=-\n"
    f"c=IN IP4 {CARRIER}\n"
    "t=0 0\n"
    "m=audio 40030 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=ptime:20\n"
    "a=sendrecv\n"
)

SRTP_OFFER = (
    "v=0\n"
    f"o=alice 70 70 IN IP4 {ALICE}\n"
    "s=-\n"
    f"c=IN IP4 {ALICE}\n"
    "t=0 0\n"
    "m=audio 49170 RTP/SAVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=sendrecv\n"
)

SRTP_ANSWER_MISMATCH = (
    "v=0\n"
    f"o=bob 71 71 IN IP4 {CARRIER}\n"
    "s=-\n"
    f"c=IN IP4 {CARRIER}\n"
    "t=0 0\n"
    "m=audio 40040 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=sendrecv\n"
)

ICE_OFFER = (
    "v=0\n"
    f"o=alice 80 80 IN IP4 {ALICE}\n"
    "s=-\n"
    f"c=IN IP4 {ALICE}\n"
    "t=0 0\n"
    "m=audio 49170 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    f"a=candidate:1 1 UDP 2130706431 {ALICE} 49170 typ host\n"
    f"a=candidate:2 1 UDP 1694498815 {CUBE} 49170 typ srflx raddr {ALICE} rport 49170\n"
    f"a=candidate:3 1 UDP 16777215 {CUCM} 50000 typ relay raddr {ALICE} rport 49170\n"
    "a=sendrecv\n"
)

ICE_ANSWER = (
    "v=0\n"
    f"o=bob 81 81 IN IP4 {CARRIER}\n"
    "s=-\n"
    f"c=IN IP4 {CARRIER}\n"
    "t=0 0\n"
    "m=audio 40050 RTP/AVP 0\n"
    "a=rtpmap:0 PCMU/8000\n"
    f"a=candidate:1 1 UDP 2130706431 {CARRIER} 40050 typ host\n"
    "a=sendrecv\n"
)


def trying(via_host=ALICE, branch="z9hG4bK7766as01", transport="UDP"):
    return sip(
        "SIP/2.0 100 Trying",
        [
            f"Via: SIP/2.0/{transport} {via_host};branch={branch}",
            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
            "To: <sip:+15551212@example.com>",
            "Call-ID: a84b4c76e66710@example.com",
            "CSeq: 1 INVITE",
        ],
    )


def sdp_track():
    L = "Core"
    invite_two = invite(ALICE, CUBE, body=OFFER_TWO)
    answer_ok = response(200, "OK", CUBE, extra=[f"Contact: <sip:bob@{CUBE}>"], body=ANSWER_TWO)
    reinvite_hold = invite(ALICE, CUBE, extra=[], body=OFFER_HOLD, cseq=2, branch="z9hG4bKhold0001")
    hold_ok = response(200, "OK", CUBE, extra=[f"Contact: <sip:bob@{CUBE}>"], body=ANSWER_HOLD, cseq="2 INVITE")
    prack = sip(
        f"PRACK sip:bob@{CUBE} SIP/2.0",
        [
            f"Via: SIP/2.0/UDP {ALICE};branch=z9hG4bKprack01",
            "Max-Forwards: 70",
            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
            "To: <sip:+15551212@example.com>;tag=314159",
            "Call-ID: a84b4c76e66710@example.com",
            "CSeq: 2 PRACK",
            "RAck: 1 1 INVITE",
        ],
    )
    early = response(
        183,
        "Session Progress",
        CUBE,
        extra=["Require: 100rel", "RSeq: 1", f"Contact: <sip:bob@{CUBE}>"],
        body=EARLY_SDP,
    )
    ringing = response(180, "Ringing", CUBE, extra=[f"Contact: <sip:bob@{CUBE}>"])
    early_final = response(200, "OK", CUBE, extra=[f"Contact: <sip:bob@{CUBE}>"], body=FINAL_SDP)
    lessons = [
        lesson(
            L,
            id="sdp-anatomy",
            title="The lines in an SDP body",
            minutes=14,
            tags=["sdp", "rfc8866", "session"],
            summary="Read v, o, s, c, t, m, and a lines as a session description. RFC 8866 is the current SDP specification.",
            objectives=[
                "Name the session lines and the media lines",
                "State that RFC 8866 obsoletes RFC 4566 and where status is decided",
                "Separate the connection address from the RTP packets",
            ],
            illustration={
                "type": "layers",
                "title": "One SDP body, top to bottom",
                "caption": "Session lines apply until an m-line starts a stream. Media lines and their a-lines belong to that stream.",
                "layers": [
                    {"name": "v, o, s", "detail": "Version, origin, session name"},
                    {"name": "c and t", "detail": "Connection address and timing"},
                    {"name": "m", "detail": "Media type, port, proto, formats"},
                    {"name": "a", "detail": "rtpmap, fmtp, direction, ptime"},
                ],
            },
            sections=[
                sec(
                    "Which document is current",
                    "RFC 8866 is the current SDP specification, and it obsoletes RFC 4566. The RFC Editor status banner on each document is the authority for that status, so a page that still quotes only 4566 is checked against the banner before it is treated as current.",
                    "The addresses 203.0.113.10, 203.0.113.20, 198.51.100.30, and 192.0.2.40 are documentation addresses from RFC 5737, and the telephone number in these labs is +15551212 at example.com. They exist so a trace can be shared without pointing at a real network.",
                    "8866", "4566", "5737",
                ),
                sec(
                    "Session lines, then media lines",
                    "A body starts with v=0, an o= origin that carries a session id and a session version, an s= name, a c= connection address, and a t= time. The c= line names where media should be sent, and it is an address inside the description, not a sample of audio.",
                    "Each m= line opens one media stream and lists a port, a transport, and payload types. a= lines after that m= line belong to that stream, while a session-level a= line is only the default for streams that do not override it.",
                    "8866", "3264",
                ),
            ],
            flow=ladder(
                "SDP rides inside the INVITE",
                ["Alice", "SBC", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "The offer is the SDP body of this INVITE. Count v, c, and m before you read any RTP.", invite_two),
                    (1, 0, "100", "res", "100 Trying has no SDP. It does not accept or reject a stream.", trying()),
                    (1, 2, "INVITE", "req", "The SBC forwards an offer. The m-line order in this body is the order the answer must follow.", invite(CUBE, CARRIER, body=OFFER_TWO, branch="z9hG4bK7766as02")),
                    (2, 1, "200", "res", "The answer keeps two m-lines. The second port is 0, which rejects that stream and leaves the slot in place.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_TWO)),
                ],
            ),
            quiz=[
                quiz_item("Which RFC is the current SDP specification?", ["RFC 8866", "RFC 3261", "RFC 3550", "RFC 4733"], 0, "RFC 8866 obsoletes RFC 4566. The RFC Editor status banner is the authority for that status.", "8866"),
                quiz_item("What does the c= line name?", ["The connection address for media", "The SIP request URI", "The RTCP fraction lost", "The digest nonce"], 0, "c= is inside SDP. It is not a SIP header and it is not an RTP sample.", "8866"),
                quiz_item("An a= line placed after an m= line applies to", ["That media stream", "Every SIP header", "Only the Via branch", "The registrar binding"], 0, "Media-level attributes belong to the m-line they follow.", "8866"),
                quiz_item("The documentation addresses in these labs come from", ["RFC 5737", "RFC 3711", "RFC 4730", "RFC 8588"], 0, "203.0.113.0/24, 198.51.100.0/24, and 192.0.2.0/24 are documentation ranges.", "5737"),
                quiz_item("o= includes", ["A session id and a session version", "The RTP marker bit", "A Proxy-Authenticate nonce", "The STUN magic cookie"], 0, "The session version is how a later offer shows that the description changed.", "8866"),
                quiz_item("SDP itself carries", ["A description of the session", "The voice samples", "RTCP receiver reports", "A PASSporT signature"], 0, "Voice samples are RTP. SDP names the address, port, and codecs.", "8866"),
            ],
            cards=[
                card("RFC 8866", "Current SDP. It obsoletes RFC 4566. Trust the RFC Editor status banner.", "8866"),
                card("c=", "Connection address where media should be sent.", "8866"),
                card("m=", "One media stream: type, port, protocol, and payload types.", "8866"),
                card("a=", "An attribute. After m=, it belongs to that stream.", "8866"),
            ],
            lab=make_lab(
                "Point at c= and m=",
                "dissect",
                "Dissect the INVITE and find the connection line and both media lines.",
                ["Press Dissect.", "Find c=.", "Count the m= lines and read each port."],
                "How many m= lines are in this offer?",
                ["2", "0", "1", "4"],
                0,
                "The body has an audio PCMU stream and an audio PCMA stream, in that order.",
                "8866",
                message=invite_two,
            ),
            fault=make_fault(
                "Reading RTP inside the SDP body",
                "The INVITE is present and the listener still hears silence.",
                invite_two + "\n(no UDP packets on 49170 or 49172)\n",
                ["Signaling carried a description, and media has not arrived", "c= is illegal syntax", "v=0 means the call failed", "m= lines are SIP methods"],
                0,
                "SDP names the RTP destination. Silence means those packets are not in the capture.",
                "The session description is present. The voice samples are a separate RTP flow.",
                "Capture UDP on the ports in the m= lines and confirm the address in c=. Keep the SDP open only to read that address and those ports.",
                "8866", "3550",
            ),
        ),
        lesson(
            L,
            id="offer-answer-order",
            title="Same m-lines, same order",
            minutes=13,
            tags=["offer-answer", "rfc3264", "m-line"],
            summary="RFC 3264 matches streams by position. The answer has the same number of m-lines, in the same order.",
            objectives=[
                "Count m-lines in the offer and in the answer",
                "Reject a stream without deleting its position",
                "Keep later offers in the same order",
            ],
            illustration={
                "type": "states",
                "title": "Position is the match",
                "caption": "Stream 1 stays stream 1. A rejected second stream is still the second m-line.",
                "nodes": ["Offer", "Same count", "Same order", "Answer"],
            },
            sections=[
                sec(
                    "Match on position",
                    "The answer must contain the same number of m-lines as the offer, and those lines stay in the same order. RFC 3264 uses that position to decide which answer stream belongs to which offered stream, so dropping a line or swapping two lines breaks the match.",
                    "The media type and the transport on an accepted line must match the offer. A second audio line in the offer is still a second audio line in the answer, even when the answerer only wants the first codec.",
                    "3264", "3264-6",
                ),
                sec(
                    "Rejection is not deletion",
                    "To refuse one stream, the answer sets that m-line port to 0 and still includes a media type, a protocol, and a format list. The refused stream occupies the same slot, which is why the following lines do not slide up.",
                    "A later offer in the same dialog keeps those positions. RFC 6337 is the usage document that shows how easy it is to break a call by rebuilding the m-line list from scratch.",
                    "3264", "6337",
                ),
            ],
            flow=ladder(
                "Two streams, one refused",
                ["Alice", "SBC"],
                [
                    (0, 1, "INVITE", "req", "Offer: PCMU on the first m-line, PCMA on the second. Order is part of the offer.", invite_two),
                    (1, 0, "100", "res", "Trying does not answer any m-line.", trying()),
                    (1, 0, "180", "res", "180 Ringing is alerting. This one carries no SDP, so it is not the answer.", response(180, "Ringing", CUBE, extra=[f"Contact: <sip:bob@{CUBE}>"])),
                    (1, 0, "200", "res", "The answer still has two m-lines. Port 0 on the second line rejects PCMA and leaves the slot in place.", answer_ok),
                ],
            ),
            quiz=[
                quiz_item("An answer to a two-m-line offer must contain", ["Two m-lines in the same order", "One m-line, the accepted one", "The m-lines sorted by port", "No port numbers"], 0, "RFC 3264 matches streams by position, so the count and the order are mandatory.", "3264"),
                quiz_item("Swapping the two m-lines in the answer", ["Pairs each answer with the wrong offer stream", "Is required when the codec changes", "Sets the call on hold", "Satisfies RFC 8866 by itself"], 0, "Position is the identifier. Swapping audio and a second audio stream mis-assigns both.", "3264"),
                quiz_item("Port 0 on an answer m-line means", ["That stream is rejected and the slot remains", "The whole dialog is gone", "The codec clock is 8000", "RTP may use any port"], 0, "Rejection keeps the line. It does not remove it.", "3264"),
                quiz_item("RFC 6337 is", ["The offer/answer usage document for these pitfalls", "The RTP header specification", "The STUN binding method", "The digest challenge rules"], 0, "Use it beside RFC 3264 when an answer looks locally reasonable and still fails.", "6337"),
                quiz_item("A format list on a port-0 line", ["Is still present, even though the stream is unused", "Must be omitted", "Must be a SIP method", "Replaces the c= line"], 0, "RFC 3264 keeps media type, protocol, and a format list on a rejected stream.", "3264"),
                quiz_item("The offer in the lab has which order?", ["PCMU, then PCMA", "PCMA, then PCMU", "opus only", "No m-lines"], 0, "First m-line payload 0, second m-line payload 8.", "3551"),
            ],
            cards=[
                card("Same count", "The answer has exactly as many m-lines as the offer.", "3264"),
                card("Same order", "Line n in the answer answers line n in the offer.", "3264"),
                card("Port 0", "Rejects that stream and keeps its position.", "3264"),
                card("RFC 6337", "Usage examples and the pitfalls of rebuilding SDP.", "6337"),
            ],
            lab=make_lab(
                "Negotiate two m-lines",
                "sdp",
                "Run the negotiator. The answer refuses the second stream without deleting it.",
                ["Press Negotiate.", "Confirm both m-lines are present.", "Read the second port."],
                "What does port 0 on the second answer m-line do?",
                ["Rejects that stream and keeps the order", "Deletes the line so the answer has one m-line", "Holds the call with sendonly", "Switches the codec clock to 16000"],
                0,
                "RFC 3264 refuses a stream by port 0. The line stays so the first stream is still the first stream.",
                "3264",
                offer=OFFER_TWO,
                answer=ANSWER_TWO,
            ),
            fault=make_fault(
                "Answer dropped the refused m-line",
                "The offer had two m-lines. The answer body has only the PCMU line, and the call fails.",
                "offer m-lines: 2\nanswer body:\n"
                f"c=IN IP4 {CARRIER}\n"
                "m=audio 40000 RTP/AVP 0\n"
                "a=rtpmap:0 PCMU/8000\n",
                ["The answer has fewer m-lines than the offer", "PCMU is illegal", "Port 40000 means reject", "c= must be 0.0.0.0"],
                0,
                "RFC 3264 requires the same number of m-lines in the same order. A missing line is not a clean refusal.",
                "The answerer deleted the stream it did not want instead of answering it with port 0.",
                "Put the refused stream back in the same position with port 0, a protocol, and a format list.",
                "3264", "6337",
            ),
        ),
    ]
    lessons.extend(_sdp_rest(L, reinvite_hold, hold_ok, early, prack, ringing, early_final))
    return {
        "id": "sdp",
        "title": "SDP and offer/answer",
        "summary": "How to read an SDP body, and how RFC 3264 matches offers to answers without reordering streams.",
        "level": L,
        "order": 5,
        "lessons": lessons,
    }
def _sdp_rest(L, reinvite_hold, hold_ok, early, prack, ringing, early_final):
    ack = sip(
        f"ACK sip:bob@{CUBE} SIP/2.0",
        [
            f"Via: SIP/2.0/UDP {ALICE};branch=z9hG4bK7766ack",
            "Max-Forwards: 70",
            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
            "To: <sip:+15551212@example.com>;tag=314159",
            "Call-ID: a84b4c76e66710@example.com",
            "CSeq: 1 ACK",
            f"Contact: <sip:alice@{ALICE}>",
        ],
    )
    prack_ok = response(200, "OK", CUBE, cseq="2 PRACK", body="")
    return [
        lesson(
            L,
            id="rtpmap-fmtp",
            title="rtpmap names and fmtp parameters",
            minutes=15,
            tags=["rtpmap", "fmtp", "g722"],
            summary="Match codecs by the rtpmap encoding name. The G.722 rtpmap clock stays 8000.",
            objectives=[
                "Match dynamic codecs by encoding name",
                "Recite the static payload types 0, 8, 9, and 18",
                "Keep the G.722 rtpmap clock at 8000",
            ],
            illustration={
                "type": "table",
                "title": "Names that survive a payload-type change",
                "caption": "Static types may omit rtpmap. Dynamic types are meaningless until rtpmap names them. G722/8000 is the required clock.",
                "columns": ["PT", "rtpmap name", "Clock", "Role"],
                "rows": [
                    ["0", "PCMU", "8000", "Static, G.711 mu-law"],
                    ["8", "PCMA", "8000", "Static, G.711 A-law"],
                    ["9", "G722", "8000", "Static clock, 16 kHz audio"],
                    ["18", "G729", "8000", "Static"],
                    ["96-127", "from rtpmap", "in rtpmap", "Dynamic, match the name"],
                ],
            },
            sections=[
                sec(
                    "Match the encoding name",
                    "A dynamic payload type is a number from 96 through 127, and that number has no codec meaning until a=rtpmap assigns an encoding name. RFC 3264 matching uses the encoding name, so payload type 96 for opus and payload type 111 for opus are the same codec.",
                    "Static payload types from RFC 3551 include 0 PCMU/8000, 8 PCMA/8000, 9 G722/8000, and 18 G729/8000, and those names apply even when rtpmap is omitted. Writing the rtpmap anyway is legal, and it is how you show the clock you expect the peer to use.",
                    "3264", "3551", "8866",
                ),
                sec(
                    "fmtp belongs to one payload type",
                    "a=fmtp parameters apply only to the payload type named on that line, on that m-line. Accept a format parameter only when you implement it, and reject that payload type instead of guessing when the parameter is unknown.",
                    "The G.722 line is the clock-rate trap inside an otherwise ordinary rtpmap attribute, and the token you write is G722/8000 even though the audio sample rate is 16 kHz, because RFC 3551 fixed the RTP clock at 8000. A 20 ms packet advances the timestamp by 160 on that 8000 Hz clock, and rewriting the clock to 16000 will miss a peer that followed the RFC.",
                    "3551", "8866", "3264",
                ),
            ],
            flow=ladder(
                "96 and 111 are both opus",
                ["Alice", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "The offer uses payload 96 for opus and payload 9 for G722/8000. The number 96 is local to this offer.", invite(ALICE, CARRIER, body=OFFER_RTPMAP)),
                    (1, 0, "100", "res", "Trying carries no rtpmap, so it selects nothing.", trying()),
                    (1, 0, "180", "res", "Ringing is not a codec selection.", response(180, "Ringing", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"])),
                    (1, 0, "200", "res", "The answer uses payload 111 for opus. The encoding name matches. G722 stays at clock 8000 on both sides.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_RTPMAP)),
                ],
            ),
            quiz=[
                quiz_item("Dynamic payload types are matched by", ["The rtpmap encoding name", "The payload type number alone", "The UDP source port", "The Call-ID"], 0, "96 and 111 can be the same codec when both rtpmap lines name it.", "3264"),
                quiz_item("RFC 3551 assigns payload type 0 to", ["PCMU/8000", "PCMA/8000", "G722/16000", "G729/16000"], 0, "0 is PCMU/8000. 8 is PCMA/8000.", "3551"),
                quiz_item("The rtpmap clock for G.722 is", ["8000", "16000", "48000", "90000"], 0, "The audio sample rate is 16 kHz. RFC 3551 keeps the RTP clock at 8000.", "3551"),
                quiz_item("A 20 ms G.722 timestamp increases by", ["160, using the 8000 Hz rtpmap clock", "320, using a 16000 Hz rtpmap clock", "20, one step per millisecond", "1, one step per packet only"], 0, "Timestamp units are the rtpmap clock. 8000 times 0.020 is 160.", "3551"),
                quiz_item("a=fmtp applies to", ["The payload type named on that fmtp line", "Every m-line in the body", "The SIP From header", "RTCP only"], 0, "Format parameters are per payload type. Unknown parameters are a reason to reject that format.", "8866"),
                quiz_item("Payload type 18 is", ["G729/8000", "PCMU/8000", "opus/48000/2", "telephone-event/8000"], 0, "18 is the static G729 mapping. telephone-event is dynamic.", "3551"),
            ],
            cards=[
                card("Encoding name", "Match opus to opus even when the payload type numbers differ.", "3264"),
                card("0 / 8 / 9 / 18", "PCMU/8000, PCMA/8000, G722/8000, G729/8000.", "3551"),
                card("G722/8000", "RTP clock is 8000. Audio sample rate is 16 kHz.", "3551"),
                card("fmtp", "Parameters for one payload type. Do not guess unknown ones.", "8866"),
            ],
            lab=make_lab(
                "Match opus on the name",
                "sdp",
                "The offer says payload 96 opus. The answer says payload 111 opus. G722/8000 is on payload 9 on both sides.",
                ["Press Negotiate.", "Find opus and compare the payload type numbers.", "Read the G722 clock on both sides."],
                "Why do payload types 96 and 111 both carry the call?",
                ["Both rtpmap lines name opus", "96 and 111 are fixed by RFC 3551", "The ports are equal", "fmtp is ignored and the numbers must match"],
                0,
                "Dynamic payload types are local numbers. The encoding name is the match.",
                "3264",
                offer=OFFER_RTPMAP,
                answer=ANSWER_RTPMAP,
            ),
            fault=make_fault(
                "G722 clock rewritten to 16000",
                "One side offers a=rtpmap:9 G722/8000. The other side answers a=rtpmap:9 G722/16000 and no audio starts.",
                "offer: a=rtpmap:9 G722/8000\nanswer: a=rtpmap:9 G722/16000\n",
                ["The rtpmap clock must stay 8000 for G.722", "G.722 audio is 8 kHz so 16000 is required", "Payload type 9 is opus", "fmtp 0-15 belongs on G722"],
                0,
                "RFC 3551 sets the G.722 RTP clock to 8000 even though the audio sample rate is 16 kHz.",
                "A policy rewrote the clock to the sample rate and the encoding no longer matches.",
                "Restore a=rtpmap:9 G722/8000. Leave the audio sample rate at 16 kHz and step the timestamp by 160 for a 20 ms packet.",
                "3551", "3264",
            ),
        ),
        lesson(
            L,
            id="direction-hold",
            title="Direction attributes and hold",
            minutes=12,
            tags=["direction", "hold", "rfc3264"],
            summary="sendrecv, sendonly, recvonly, and inactive are per stream. Hold is commonly sendonly or inactive.",
            objectives=[
                "List the four direction attributes",
                "Answer sendonly with recvonly or inactive",
                "Place a call on hold without c=0.0.0.0",
            ],
            illustration={
                "type": "table",
                "title": "Legal answers",
                "caption": "The answer direction is from the answerer. Hold offers are commonly sendonly or inactive.",
                "columns": ["Offer", "Answer may be"],
                "rows": [
                    ["sendrecv", "sendrecv, sendonly, recvonly, or inactive"],
                    ["sendonly", "recvonly or inactive"],
                    ["recvonly", "sendonly or inactive"],
                    ["inactive", "inactive"],
                ],
            },
            sections=[
                sec(
                    "Direction is a property of the stream",
                    "Each stream is sendrecv, sendonly, recvonly, or inactive, and a media-level attribute overrides a session-level default. The answer uses the answerer's point of view, so an offer of sendonly is answered with recvonly or with inactive.",
                    "sendrecv means the agent will send and receive, sendonly means it will send and does not want to receive, and recvonly means it will only receive media on that stream. inactive means the agent will do neither, and an inactive offer is answered with inactive.",
                    "3264", "3264-6",
                ),
                sec(
                    "Hold is a direction change",
                    "Hold is commonly sendonly, when the holder still sends such as music, or inactive, when neither side should send. The peer answers sendonly with recvonly, or answers inactive with inactive, in a new offer/answer exchange such as a re-INVITE.",
                    "Do not put a call on hold by setting c=IN IP4 0.0.0.0. RFC 3264 retired that old behavior because it breaks RTCP and IPv6, and RFC 6337 is the usage document for this family of mistakes.",
                    "3264", "6337",
                ),
            ],
            flow=ladder(
                "re-INVITE to sendonly",
                ["Alice", "SBC"],
                [
                    (0, 1, "INVITE", "req", "The first offer is sendrecv. Media can flow both ways after the answer.", invite(ALICE, CUBE)),
                    (1, 0, "200", "res", "The answer is sendrecv. This is the established call, before hold.", response(200, "OK", CUBE, extra=[f"Contact: <sip:bob@{CUBE}>"], body=SDP_OK)),
                    (0, 1, "re-INVITE", "req", "Alice offers sendonly. That is a common hold: she may still send audio such as music, and she will not receive the other party's audio.", reinvite_hold),
                    (1, 0, "200", "res", "The answer is recvonly, which fits a sendonly offer. Bob will receive and will not send.", hold_ok),
                ],
            ),
            quiz=[
                quiz_item("A sendonly offer may be answered with", ["recvonly or inactive", "sendrecv only", "sendonly only", "A port of 0 only"], 0, "RFC 3264 section 6 limits the answer directions for each offer direction.", "3264-6"),
                quiz_item("Hold is commonly", ["sendonly or inactive", "always recvonly in the offer", "a change of Call-ID", "payload type 0 only"], 0, "sendonly still sends, for example music. inactive sends nothing.", "3264"),
                quiz_item("c=IN IP4 0.0.0.0 for hold is", ["Not the current rule. Use a direction attribute", "Required by RFC 8866", "The STUN mapped address", "How port 0 is written"], 0, "RFC 3264 stopped using the zero connection address for hold.", "3264"),
                quiz_item("An inactive offer is answered with", ["inactive", "sendrecv", "sendonly", "recvonly"], 0, "Neither side sends when the stream is inactive.", "3264"),
                quiz_item("A media-level direction attribute", ["Overrides the session-level default for that stream", "Changes Max-Forwards", "Rewrites the From tag", "Sets the RTP version"], 0, "Put a=sendonly under the m-line you are holding.", "8866"),
                quiz_item("recvonly means the agent will", ["Only receive on that stream", "Only send on that stream", "Reject the m-line", "Place the RTP clock at 16000"], 0, "recvonly is the usual answer to a sendonly hold.", "3264"),
            ],
            cards=[
                card("sendrecv", "Send and receive. The usual active call.", "3264"),
                card("sendonly", "Send, and do not receive. A common hold.", "3264"),
                card("recvonly", "Receive only. The usual answer to sendonly.", "3264"),
                card("inactive", "Neither direction. Also a common hold.", "3264"),
            ],
            lab=make_lab(
                "Answer a hold",
                "sdp",
                "The offer is sendonly. A legal answer is recvonly. Negotiate and read the direction line.",
                ["Press Negotiate.", "Read the offer direction.", "Read the answer direction."],
                "Which answer direction fits this sendonly offer?",
                ["recvonly", "sendrecv", "sendonly", "A deleted m-line"],
                0,
                "The answerer will receive the held stream, or it may answer inactive. sendrecv does not fit.",
                "3264",
                offer=OFFER_HOLD,
                answer=ANSWER_HOLD,
            ),
            fault=make_fault(
                "Hold written as 0.0.0.0",
                "Music-on-hold re-INVITE sets the connection address to 0.0.0.0 and leaves a=sendrecv. The peer keeps the old media or drops RTCP.",
                "c=IN IP4 0.0.0.0\na=sendrecv\nm=audio 49170 RTP/AVP 0\n",
                ["Hold should be sendonly or inactive, not a zero connection address", "0.0.0.0 is required by RFC 3550", "sendrecv means the stream is rejected", "The session version must be set to 0.0.0.0"],
                0,
                "RFC 3264 uses direction attributes for hold. The zero address is the retired behavior.",
                "The offer tried to signal hold with c=0.0.0.0 and still advertised sendrecv.",
                "Send a new offer with a=sendonly or a=inactive, keep a real c= address so RTCP still has a destination, and increment the o= session version.",
                "3264", "6337",
            ),
        ),
        lesson(
            L,
            id="port-zero",
            title="Port 0 rejects a stream",
            minutes=11,
            tags=["port-zero", "rfc3264", "reject"],
            summary="Port 0 refuses the stream in that slot. The m-line stays, with a protocol and a format list.",
            objectives=[
                "Write a rejection as port 0",
                "Keep the rejected line in order",
                "Refuse a stream that has no codec in common",
            ],
            illustration={
                "type": "states",
                "title": "Refuse without renumbering",
                "caption": "The second stream is unused. It is still the second m-line.",
                "nodes": ["Offered", "Port 0", "Slot kept", "Later offer"],
            },
            sections=[
                sec(
                    "Zero rejects one stream",
                    "Set the answer port to 0 to reject that offered stream. RFC 3264 still requires the media type, the transport protocol, and a format list on that line, so m=audio 0 RTP/AVP 0 is a refusal and not a blank line.",
                    "Use port 0 when the answerer has no payload type in common with that m-line. Omitting the m-line is a different bug, the count bug, and it mis-numbers every later stream.",
                    "3264", "3264-6",
                ),
                sec(
                    "The slot survives",
                    "A re-offer that wants the stream to stay rejected offers it again at port 0 in the same position, and the answer also uses port 0 there. Adding a new stream means appending a new m-line, not recycling a rejected slot's place in line.",
                    "An offered port of 0 must be rejected. Do not answer a zero offer port with a real port, and do not treat port 0 as a request to pick a port of your own.",
                    "3264", "6337",
                ),
            ],
            flow=ladder(
                "Second stream refused",
                ["Alice", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "Two audio streams are offered, PCMU then PCMA.", invite(ALICE, CARRIER, body=OFFER_PORT0)),
                    (1, 0, "100", "res", "100 Trying is not a rejection of either stream.", trying()),
                    (1, 0, "200", "res", "PCMU is accepted on a real port. PCMA is answered with port 0 and still listed second.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_PORT0)),
                    (0, 1, "ACK", "req", "ACK completes the dialog. It does not add or remove m-lines.", ack),
                ],
            ),
            quiz=[
                quiz_item("Which answer port rejects a stream?", ["0", "5060", "9", "65535"], 0, "Port 0 is the RFC 3264 rejection. 5060 is a SIP port, not an m-line rejection.", "3264"),
                quiz_item("A rejected m-line still includes", ["Media type, protocol, and a format list", "Only the digit 0", "A STUN binding", "An Identity header"], 0, "The rest of the line stays so parsers can keep the slot.", "3264"),
                quiz_item("No shared codec on one m-line means", ["Reject that m-line with port 0", "Delete every m-line", "Reuse payload type 0 for opus", "Set c= to 0.0.0.0"], 0, "Refuse the stream you cannot speak. Leave the other streams in their positions.", "3264"),
                quiz_item("An offer that already uses port 0", ["Must be rejected with port 0", "Must be answered with port 49170", "Is a hold", "Is early media"], 0, "A zero port in the offer is not a request for the answerer to allocate a port.", "3264"),
                quiz_item("Appending a new stream", ["Adds an m-line at the end", "Reuses a rejected line's index", "Changes the Call-ID", "Sets a=inactive on line 1"], 0, "Positions are stable. New media is a new line.", "3264"),
                quiz_item("Removing a rejected line from the answer", ["Changes the count and breaks RFC 3264", "Is the preferred rejection", "Is required by RFC 3551", "Sets the G.722 clock correctly"], 0, "Count and order stay aligned with the offer.", "3264"),
            ],
            cards=[
                card("m=audio 0", "Rejects that audio stream. Keep proto and a format.", "3264"),
                card("Same index", "A rejected line is still answered in its original position.", "3264"),
                card("No common codec", "Port 0 on that m-line, not a deleted body.", "3264"),
                card("Offer port 0", "The answer port is also 0.", "3264"),
            ],
            lab=make_lab(
                "See a zero port",
                "sdp",
                "Negotiate an offer of two audio lines. The answer accepts the first and zeros the second.",
                ["Press Negotiate.", "Read m-line 1.", "Read the port on m-line 2."],
                "The second answer m-line is",
                ["Rejected with port 0 and still present", "Missing, which is correct", "sendonly hold", "A SIP 488 by itself"],
                0,
                "Port 0 rejects PCMA. PCMU remains the first stream.",
                "3264",
                offer=OFFER_PORT0,
                answer=ANSWER_PORT0,
            ),
            fault=make_fault(
                "Zero port answered with a real port",
                "A re-INVITE offers m=audio 0 RTP/AVP 8 in the second slot. The peer answers m=audio 40002 RTP/AVP 8 and media appears on a stream that was supposed to be gone.",
                "offer line 2: m=audio 0 RTP/AVP 8\nanswer line 2: m=audio 40002 RTP/AVP 8\n",
                ["An offered port of 0 must be answered with port 0", "40002 means rejection", "The first m-line had to be deleted", "PCMA's clock must become 16000"],
                0,
                "RFC 3264 requires a zero offer port to be rejected.",
                "The answerer allocated a media port for a stream the offer had already removed.",
                "Answer that slot with port 0, keep the line in place, and do not send RTP on it.",
                "3264", "6337",
            ),
        ),
        lesson(
            L,
            id="early-media",
            title="Early media and 183",
            minutes=14,
            tags=["early-media", "rfc3960", "183"],
            summary="183 Session Progress with SDP is the usual early-media pattern. 180 means ringing. A 183 does not always have SDP.",
            objectives=[
                "Recognize 183 with SDP as a usual early-media pattern",
                "Treat 180 as ringing",
                "Read a 183 that has no SDP as still a 183",
            ],
            illustration={
                "type": "states",
                "title": "Progress is not one body",
                "caption": "This ladder's 183 happens to carry SDP. 180 is ringing and has no SDP here. A 183 is allowed to omit SDP.",
                "nodes": ["INVITE", "183", "PRACK", "180"],
            },
            sections=[
                sec(
                    "183 is progress, and SDP is optional on it",
                    "RFC 3960 describes early media, and the usual pattern is 183 Session Progress carrying SDP so the caller can play an announcement or remote ringback. A 183 does not always contain SDP, so you read the body of that message instead of treating the status code as proof of media.",
                    "180 Ringing means the far end is alerting, and when that 180 has no SDP the caller generates local ringback unless early media from an earlier 183 is already playing. Keep those two jobs separate, because ringing is not the same event as early media.",
                    "3960", "3261-21",
                ),
                sec(
                    "Reliable provisional responses",
                    "A provisional response is not reliable unless RFC 3262 applies, which means Require 100rel, an RSeq, and a PRACK. If the INVITE carried the offer, a reliable 183 can carry the answer, and an unreliable 183 with SDP is a common carrier pattern that is not the same thing as a finished reliable answer.",
                    "Read the SDP in the 200 OK to the INVITE as well. Early-media ports and the final answer ports can differ, and RFC 6337 is the usage document when those two bodies disagree.",
                    "3262", "3264", "6337",
                ),
            ],
            flow=ladder(
                "183 with SDP, then 180 without it",
                ["Alice", "SBC"],
                [
                    (0, 1, "INVITE", "req", "Early offer. The INVITE carries the SDP offer.", invite(ALICE, CUBE)),
                    (1, 0, "100", "res", "Trying stops retransmissions. It is not early media.", trying()),
                    (1, 0, "183", "res", "This 183 carries SDP, the usual early-media pattern. A 183 is also valid with no SDP at all.", early),
                    (0, 1, "PRACK", "req", "PRACK acknowledges the reliable provisional response. RAck echoes RSeq 1 and CSeq 1 INVITE.", prack),
                    (1, 0, "200", "res", "200 OK to the PRACK. The INVITE is still unanswered.", prack_ok),
                    (1, 0, "180", "res", "180 Ringing has no SDP in this ladder. It means alerting, not a second offer.", ringing),
                ],
            ),
            quiz=[
                quiz_item("The usual early-media pattern in RFC 3960 is", ["183 Session Progress with SDP", "180 Ringing with no status line", "ACK carrying the RTP samples", "A 407 challenge"], 0, "183 with SDP is usual. It is not mandatory on every 183.", "3960"),
                quiz_item("A 183 response", ["May omit SDP", "Always includes SDP", "Always rejects the call", "Is a final response"], 0, "Read the body. The status code alone does not prove that SDP is present.", "3960"),
                quiz_item("180 Ringing means", ["The far end is alerting", "Early media is required", "The offer was rejected", "Digest failed"], 0, "Local ringback is appropriate when the 180 has no SDP and early media is not already playing.", "3261-21"),
                quiz_item("100rel reliability uses", ["Require, RSeq, and PRACK, per RFC 3262", "Only a second INVITE", "RTP sequence numbers", "a=inactive"], 0, "An unreliable 183 is not a completed reliable answer.", "3262"),
                quiz_item("If early-media SDP and the 200 OK SDP differ", ["Read both. The ports can change", "Ignore the 200 OK", "Assume 183 always wins because it is earlier", "Set every port to 0"], 0, "RFC 6337 collects this class of offer/answer mistake.", "6337"),
                quiz_item("100 Trying", ["Does not establish early media", "Carries the answer SDP", "Is the ringing signal", "Is defined by RFC 4733"], 0, "Trying is hop-by-hop progress with no media description in this pattern.", "3261-21"),
            ],
            cards=[
                card("183 + SDP", "Usual early-media pattern. Not true of every 183.", "3960"),
                card("180", "Ringing. Local ringback when this message has no SDP.", "3261-21"),
                card("100rel", "Makes a provisional response reliable. PRACK it.", "3262"),
                card("Two bodies", "Compare 183 SDP with the 200 OK SDP before you lock the port.", "6337"),
            ],
            lab=make_lab(
                "183 has SDP, 180 does not",
                "capture",
                "Extract both responses. One progress message has SDP and the ringing message does not.",
                ["Press Extract SIP.", "Open the 183 and look for m=.", "Open the 180 and confirm there is no SDP."],
                "Which message is the usual early-media carrier in this capture?",
                ["The 183 that contains SDP", "The 180, because ringing always includes SDP", "The 100 Trying", "Every 183, whether or not a body is present"],
                0,
                "This 183 has SDP. That is the usual pattern, and it is a property of this message, not of every 183.",
                "3960",
                message="Sent:\n" + invite(ALICE, CUBE) + "\nReceived:\n" + early + "\nReceived:\n" + ringing,
            ),
            fault=make_fault(
                "Local ringback on top of early media",
                "The caller plays local ringback and a remote announcement at the same time.",
                "SIP/2.0 183 Session Progress\nContent-Type: application/sdp\nm=audio 40002 RTP/AVP 0\n"
                "SIP/2.0 180 Ringing\nContent-Length: 0\n",
                ["Early media from the 183 is already playing, so the 180 should not start a second local ringback", "180 always carries SDP and 183 never does", "Both codes mean the call failed", "PRACK is the audio codec"],
                0,
                "RFC 3960 separates remote early media from local ringback. Playing both is the clipping and double-audio failure.",
                "The phone treated 180 as an order to start local ringback even though the 183 SDP session was already up.",
                "If early media is established, do not add local ringback when the later 180 has no SDP. Keep reading each body, because a different 183 might have no SDP at all.",
                "3960", "3262",
            ),
        ),
        lesson(
            L,
            id="pitfalls-6337",
            title="Offer/answer pitfalls in RFC 6337",
            minutes=13,
            tags=["rfc6337", "pitfalls", "reinvite"],
            summary="RFC 6337 is the usage document for offer/answer mistakes: order, version, delayed offer, and hold.",
            objectives=[
                "Increment the SDP session version when the description changes",
                "Tell an early offer from a delayed offer",
                "Stop using a zero connection address as hold",
            ],
            illustration={
                "type": "layers",
                "title": "Four ways an answer goes wrong",
                "caption": "RFC 3264 is the rule. RFC 6337 is where the same mistakes show up in real exchanges.",
                "layers": [
                    {"name": "Count", "detail": "Fewer m-lines than the offer"},
                    {"name": "Order", "detail": "Lines swapped or a slot reused"},
                    {"name": "Version", "detail": "o= sess-version not increased"},
                    {"name": "Hold", "detail": "0.0.0.0 instead of a direction"},
                ],
            },
            sections=[
                sec(
                    "Usage, not a second protocol",
                    "RFC 6337 is the offer/answer usage document that operators open when a locally reasonable SDP still fails. It does not replace RFC 3264, and it shows the failures that follow from rebuilding SDP instead of editing it, including dropped m-lines, swapped m-lines, and payload types matched by number.",
                    "When the SDP you send is different from the SDP you sent before, increment the sess-version in o=. Peers treat an unchanged version as the same description, so a hold or a new port hidden under the old version is easy to ignore.",
                    "6337", "3264", "8866",
                ),
                sec(
                    "Where the offer sits",
                    "If the INVITE contains SDP, that body is the offer and the answer belongs in a reliable response. If the INVITE contains no SDP, the offer is in a reliable response from the far side and the answer is in the ACK, which is the delayed-offer pattern.",
                    "Do not put an answer in the 200 OK when the INVITE already carried the offer, and do not put a second offer in that 200 OK just because a 183 already answered. Read RFC 6337 when a call has SDP in more than one response.",
                    "3264", "6337", "3261-13",
                ),
                sec(
                    "Hold and rejected streams, again",
                    "The usage mistakes that operators repeat are hold via c=IN IP4 0.0.0.0, and deletion of a rejected m-line. Direction attributes perform hold, and port 0 performs rejection, and both leave the rest of the body aligned.",
                    "A codec change uses the rtpmap name, including G722/8000 rather than a rewritten 16000 Hz clock. RFC 6337 is the checklist you open after the rules in RFC 3264 are already in front of you.",
                    "6337", "3264", "3551",
                ),
            ],
            flow=ladder(
                "Delayed offer, then the ACK answer",
                ["Alice", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "This INVITE has no SDP. It is a delayed offer, so Alice has not offered yet.", invite(ALICE, CARRIER, body="")),
                    (1, 0, "100", "res", "Trying still has no offer.", trying()),
                    (1, 0, "200", "res", "The offer arrives in the 200 OK because the INVITE had none. This pattern is not the early-offer pattern.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=FINAL_SDP)),
                    (0, 1, "ACK", "req", "The answer to a delayed offer goes in the ACK. Do not wait for a later re-INVITE to answer.", sip(
                        f"ACK sip:bob@{CARRIER} SIP/2.0",
                        [
                            f"Via: SIP/2.0/UDP {ALICE};branch=z9hG4bKackdelay",
                            "Max-Forwards: 70",
                            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
                            "To: <sip:+15551212@example.com>;tag=314159",
                            "Call-ID: a84b4c76e66710@example.com",
                            "CSeq: 1 ACK",
                            f"Contact: <sip:alice@{ALICE}>",
                            "Content-Type: application/sdp",
                        ],
                        ANSWER_HOLD.replace("a=recvonly", "a=sendrecv"),
                    )),
                ],
            ),
            quiz=[
                quiz_item("RFC 6337 is best used as", ["The usage document for offer/answer pitfalls", "A replacement for RFC 3264", "The RTP payload-type registry", "The digest algorithm list"], 0, "The rules stay in RFC 3264. RFC 6337 shows how they fail in practice.", "6337"),
                quiz_item("When a new SDP differs from the previous one, you", ["Increment o= sess-version", "Keep the same sess-version so it looks stable", "Reset v= to 1", "Remove c="], 0, "An unchanged session version tells the peer the description did not change.", "8866"),
                quiz_item("An INVITE with no SDP means", ["The offer will arrive in a reliable response, and the answer goes in the ACK", "The call cannot use media", "The ACK must be empty", "183 is forbidden"], 0, "That is delayed offer. Early offer is SDP in the INVITE.", "3264"),
                quiz_item("Matching payload type 96 to payload type 96 without rtpmap", ["Is the pitfall. Match the encoding name", "Is required by RFC 6337", "Sets G.722 correctly", "Rejects with port 5060"], 0, "Dynamic numbers are not globally assigned.", "3264"),
                quiz_item("Hold in a current offer uses", ["sendonly or inactive", "c=IN IP4 0.0.0.0 and sendrecv", "A new Call-ID", "Port 5061"], 0, "The zero connection address is the old hold behavior RFC 3264 moved away from.", "3264"),
                quiz_item("Deleting a rejected m-line", ["Breaks the equal-count rule", "Is the RFC 6337 recommendation", "Is required when using PCMU", "Changes the RTP version field"], 0, "Keep the line and set the port to 0.", "3264"),
            ],
            cards=[
                card("RFC 6337", "Offer/answer usage and the mistakes to stop repeating.", "6337"),
                card("sess-version", "Increase it when the SDP changes.", "8866"),
                card("Delayed offer", "No SDP in the INVITE. Offer in the reliable response. Answer in the ACK.", "3264"),
                card("Do not rebuild", "Edit m-lines in place. Do not drop, swap, or renumber them.", "6337"),
            ],
            lab=make_lab(
                "Find the delayed offer",
                "dissect",
                "This INVITE has an empty body. Decide where the offer is allowed to appear.",
                ["Dissect the INVITE.", "Confirm Content-Length is 0.", "Name the message that will carry the offer."],
                "Where does the offer go when the INVITE has no SDP?",
                ["In a reliable response from the callee", "It is illegal to continue", "Only inside 100 Trying", "Only inside a REGISTER"],
                0,
                "Delayed offer puts the offer in a reliable response and the answer in the ACK.",
                "3264",
                message=invite(ALICE, CARRIER, body=""),
            ),
            fault=make_fault(
                "Session version left unchanged on hold",
                "A re-INVITE changes a=sendrecv to a=sendonly but o= still says session version 2890844526. The peer keeps sending media.",
                "o=alice 2890844526 2890844526 IN IP4 203.0.113.10\n"
                "previous direction a=sendrecv\n"
                "new body direction a=sendonly\n"
                "sess-version unchanged\n",
                ["The session version did not increase, so the peer can treat the SDP as unchanged", "sendonly is illegal", "2890844526 is a port", "Hold requires payload type 18"],
                0,
                "RFC 8866 uses sess-version to signal a modified session description.",
                "The hold offer reused the previous version number, so the change looked like a retransmission of the old SDP.",
                "Increment sess-version, keep a=sendonly or a=inactive, and do not signal hold with c=0.0.0.0.",
                "8866", "6337", "3264",
            ),
        ),
    ]
def rtp_track():
    L = "Core"
    info_dtmf = sip(
        f"INFO sip:+15551212@{CARRIER} SIP/2.0",
        [
            f"Via: SIP/2.0/UDP {ALICE};branch=z9hG4bKinfo01",
            "Max-Forwards: 70",
            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
            "To: <sip:+15551212@example.com>;tag=314159",
            "Call-ID: a84b4c76e66710@example.com",
            "CSeq: 2 INFO",
            "Content-Type: application/dtmf-relay",
        ],
        "Signal=5\nDuration=160\n",
    )
    one_way_answer = (
        "v=0\n"
        f"o=bob 90 90 IN IP4 {CARRIER}\n"
        "s=-\n"
        f"c=IN IP4 {CARRIER}\n"
        "t=0 0\n"
        "m=audio 40060 RTP/AVP 0\n"
        "a=rtpmap:0 PCMU/8000\n"
        "a=sendonly\n"
    )
    lessons = [
        lesson(
            L,
            id="rtp-header",
            title="The RTP header",
            minutes=12,
            tags=["rtp", "rfc3550", "header"],
            summary="RTP version 2 carries a sequence number, a timestamp, an SSRC, and a marker bit. SIP does not carry those fields.",
            objectives=[
                "Name version, sequence, timestamp, SSRC, and marker",
                "Separate the RTP header from the SIP message",
                "Use the timestamp clock of the payload, not the wall clock",
            ],
            illustration={
                "type": "layers",
                "title": "Fixed RTP header",
                "caption": "Version 2 is the version you will capture. The marker bit is part of this header.",
                "layers": [
                    {"name": "V=2", "detail": "Version field is 2"},
                    {"name": "M + PT", "detail": "Marker bit and payload type"},
                    {"name": "Sequence", "detail": "Increments by one each packet"},
                    {"name": "Timestamp", "detail": "Media clock, not wall clock"},
                    {"name": "SSRC", "detail": "Synchronization source identifier"},
                ],
            },
            sections=[
                sec(
                    "Version 2 and the fields beside it",
                    "RFC 3550 defines RTP, and the version field in the header is 2. The same header carries a marker bit, a 7-bit payload type, a 16-bit sequence number, a 32-bit timestamp, and a 32-bit SSRC.",
                    "The sequence number increases by one for each RTP packet that source sends, so a gap is a loss signal. The SSRC is chosen by the sender and identifies that source inside the session, which is a different job from the SIP Call-ID.",
                    "3550",
                ),
                sec(
                    "The timestamp is a media clock",
                    "The timestamp advances by the number of clock ticks in the packet, using the payload clock, and it is not a wall-clock time. For 20 ms of G.711 at 8000 Hz the timestamp increases by 160, and the same step of 160 applies to G.722 because its rtpmap clock is also 8000.",
                    "For audio, the marker bit is set on the first packet after a silence gap, which is an RFC 3551 use of the bit RFC 3550 defined. A 200 OK never contains these fields, so a media fault is read from the RTP capture.",
                    "3550", "3551",
                ),
            ],
            flow=ladder(
                "SIP finishes, then RTP starts",
                ["Alice", "SBC", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "SDP offers UDP port 49170. No RTP header exists inside this INVITE.", invite(ALICE, CUBE)),
                    (1, 0, "100", "res", "Trying has no sequence number and no SSRC.", trying()),
                    (1, 2, "INVITE", "req", "The SBC offers its own media address. The RTP header is still not in the SIP message.", invite(CUBE, CARRIER, branch="z9hG4bK7766as02")),
                    (2, 1, "200", "res", "The answer names the far RTP port. Version, sequence, timestamp, SSRC, and marker begin on the UDP packets that follow.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=SDP_OK)),
                ],
            ),
            quiz=[
                quiz_item("The RTP version field is", ["2", "0", "1", "3261"], 0, "RFC 3550 packets set version to 2.", "3550"),
                quiz_item("The sequence number", ["Increments by one per RTP packet", "Increments by 160 per packet always", "Is the SIP CSeq", "Is the SDP session version"], 0, "CSeq is signaling. The RTP sequence is in the media header.", "3550"),
                quiz_item("The RTP timestamp for 20 ms of G.711 increases by", ["160", "20", "8000", "1"], 0, "8000 Hz times 20 ms is 160 timestamp units.", "3550"),
                quiz_item("SSRC identifies", ["The synchronization source in the RTP session", "The SIP dialog", "The digest realm", "The m-line index"], 0, "The sender chooses the SSRC. It is not the Call-ID.", "3550"),
                quiz_item("The audio marker bit usually marks", ["The first packet after a silence gap", "Every packet", "Only RTCP", "A rejected m-line"], 0, "RFC 3551 uses the marker bit that way for audio.", "3551"),
                quiz_item("A SIP 200 OK contains the RTP sequence number", ["No. Capture RTP to see it", "Yes, in the To tag", "Yes, in Content-Length", "Only when the method is REGISTER"], 0, "Signaling can succeed while you still need a media capture.", "3550"),
            ],
            cards=[
                card("V=2", "RTP version is 2.", "3550"),
                card("Sequence", "Plus one for every packet from that source.", "3550"),
                card("Timestamp", "Media clock. 20 ms of G.711 or G.722 steps by 160.", "3550"),
                card("SSRC", "32-bit source id chosen by the sender.", "3550"),
            ],
            lab=make_lab(
                "Find where the header is not",
                "dissect",
                "Dissect the 200 OK. The body names a port. The RTP header is not one of the SIP headers.",
                ["Dissect the response.", "Find m=audio.", "Name the five RTP header items you still have to capture."],
                "Which item is inside the RTP header rather than this SIP message?",
                ["SSRC", "Call-ID", "CSeq", "To tag"],
                0,
                "SSRC, sequence, timestamp, marker, and version are RTP. This 200 OK only carries SDP.",
                "3550",
                message=response(200, "OK", CUBE, extra=[f"Contact: <sip:bob@{CUBE}>"], body=SDP_OK),
            ),
            fault=make_fault(
                "Looking for sequence numbers in SIP",
                "The 200 OK is present, audio is choppy, and the ticket asks for the SIP CSeq to explain missing words.",
                "SIP/2.0 200 OK\nCSeq: 1 INVITE\nm=audio 19642 RTP/AVP 0\nRTP seq 44010, 44011, 44014 on UDP 19642\n",
                ["The gap is in the RTP sequence, which SIP CSeq does not report", "CSeq 1 means three RTP packets were lost", "Version 2 forbids sequence gaps", "Marker replaces the sequence number"],
                0,
                "RFC 3550 sequence numbers live on RTP packets. A jump from 44011 to 44014 is media loss.",
                "The troubleshooting notes treated CSeq as the media sequence.",
                "Capture the RTP ports from SDP and read version, sequence, timestamp, SSRC, and marker there. Use RTCP for a loss summary.",
                "3550", "3551",
            ),
        ),
        lesson(
            L,
            id="payload-types",
            title="Static and dynamic payload types",
            minutes=13,
            tags=["rfc3551", "payload", "g722"],
            summary="RFC 3551 assigns static payload types. Dynamic types are named by rtpmap, and G.722 stays at clock 8000.",
            objectives=[
                "List static types 0, 8, 9, and 18 with their clocks",
                "Require rtpmap for payload types 96 through 127",
                "Refuse a G.722 clock of 16000",
            ],
            illustration={
                "type": "table",
                "title": "Static types you must not renumber",
                "caption": "Dynamic types 96 through 127 take their meaning from rtpmap on that m-line only.",
                "columns": ["PT", "Encoding", "RTP clock"],
                "rows": [
                    ["0", "PCMU", "8000"],
                    ["8", "PCMA", "8000"],
                    ["9", "G722", "8000"],
                    ["18", "G729", "8000"],
                    ["96-127", "named by rtpmap", "named by rtpmap"],
                ],
            },
            sections=[
                sec(
                    "Static assignments",
                    "RFC 3551 assigns a small set of static payload types, including 0 PCMU/8000, 8 PCMA/8000, 9 G722/8000, and 18 G729/8000. Those numbers mean those encodings even when the offer omits rtpmap, and they are not free to reuse for opus or telephone-event.",
                    "PCMU and PCMA are both G.711, and they are not the same encoding. A peer that offers only payload 0 will not decode payload 8, so the answer has to pick a type both sides listed.",
                    "3551", "g711",
                ),
                sec(
                    "Dynamic types and the G.722 clock",
                    "Payload types 96 through 127 are dynamic, and they match only through the rtpmap encoding name, which is why two gateways can use different numbers for one codec. A policy that equates those numbers across vendors will select the wrong encoding or select nothing.",
                    "G.722 keeps rtpmap clock 8000 while the audio sample rate is 16 kHz. A 20 ms packet still advances the RTP timestamp by 160. An offer that says G722/16000 does not match an implementation that followed RFC 3551.",
                    "3551", "3264",
                ),
            ],
            flow=ladder(
                "Static types need no guess",
                ["Alice", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "Payload types 0 and 8 are static. The rtpmap lines repeat RFC 3551 so the clock is visible.", invite(ALICE, CARRIER, body=OFFER_TWO)),
                    (1, 0, "100", "res", "No payload type is selected by Trying.", trying()),
                    (1, 0, "200", "res", "The answer keeps PCMU on payload 0 and rejects the PCMA stream with port 0.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_TWO)),
                    (0, 1, "ACK", "req", "ACK carries no new payload type in this early-offer call.", sip(
                        f"ACK sip:bob@{CARRIER} SIP/2.0",
                        [
                            f"Via: SIP/2.0/UDP {ALICE};branch=z9hG4bKackpt",
                            "Max-Forwards: 70",
                            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
                            "To: <sip:+15551212@example.com>;tag=314159",
                            "Call-ID: a84b4c76e66710@example.com",
                            "CSeq: 1 ACK",
                        ],
                    )),
                ],
            ),
            quiz=[
                quiz_item("Payload type 8 is", ["PCMA/8000", "PCMU/8000", "G722/8000", "G729/8000"], 0, "0 is PCMU. 8 is PCMA. Both clocks are 8000.", "3551"),
                quiz_item("Payload type 9 is", ["G722/8000", "G722/16000", "opus/48000", "telephone-event/8000"], 0, "The RTP clock stays 8000. The audio sample rate is 16 kHz.", "3551"),
                quiz_item("Payload types 96 through 127", ["Are dynamic and need an rtpmap name", "Are all PCMU", "Are reserved for RTCP", "Match only if the numbers are equal"], 0, "The encoding name is the match. The number is local.", "3551"),
                quiz_item("PCMU and PCMA", ["Are different G.711 encodings and do not substitute for each other", "Are identical", "Share payload type 0", "Use clock 16000"], 0, "Mu-law and A-law are both in G.711 and they are not interchangeable on the wire.", "g711"),
                quiz_item("20 ms of G.722 advances the timestamp by", ["160", "320", "16", "960"], 0, "The rtpmap clock is 8000, so 20 ms is 160 ticks, not 320.", "3551"),
                quiz_item("Payload type 18 is", ["G729/8000", "PCMU/16000", "G722/16000", "A dynamic type"], 0, "18 is the static G.729 assignment.", "3551"),
            ],
            cards=[
                card("PT 0", "PCMU/8000, static.", "3551"),
                card("PT 8", "PCMA/8000, static. Not the same as PCMU.", "3551"),
                card("PT 9", "G722/8000. Sample rate is still 16 kHz.", "3551"),
                card("PT 18", "G729/8000, static.", "3551"),
            ],
            lab=make_lab(
                "Read static types",
                "sdp",
                "The offer lists PCMU and PCMA on separate m-lines. Confirm the clocks are 8000.",
                ["Press Negotiate.", "Read payload 0.", "Read payload 8 and its clock."],
                "The rtpmap clock on payload 8 is",
                ["8000", "16000", "48000", "0"],
                0,
                "PCMA is static payload 8 at 8000 Hz.",
                "3551",
                offer=OFFER_TWO,
                answer=ANSWER_TWO,
            ),
            fault=make_fault(
                "Payload 96 treated as a universal codec",
                "Both sides use payload type 96 and there is no audio. The rtpmap lines name different encodings.",
                "offer a=rtpmap:96 opus/48000/2\nanswer a=rtpmap:96 PCMU/8000\n",
                ["The payload type number matched and the encoding name did not", "96 is statically PCMU in RFC 3551", "opus uses payload type 0", "Clock 48000 is the G.722 rule"],
                0,
                "Dynamic types match on the rtpmap encoding name, not on the number.",
                "A policy assumed payload 96 meant the same codec in every network.",
                "Compare encoding names. Negotiate a name both sides listed, and keep G722 at clock 8000 when that codec is chosen.",
                "3551", "3264",
            ),
        ),
        lesson(
            L,
            id="codec-choices",
            title="G.711, G.729, and Opus",
            minutes=14,
            tags=["opus", "g711", "g729"],
            summary="Choose a codec both sides named. Read RFC 6716 and the Opus license before you draw any legal conclusion.",
            objectives=[
                "Separate G.711 PCMU from PCMA",
                "Point at ITU-T G.729 without stating a patent date",
                "Read the Opus RFC and the license, and stop there",
            ],
            illustration={
                "type": "table",
                "title": "What to read before you pick",
                "caption": "Codec documents and license pages are different from the payload type number.",
                "columns": ["Codec", "Where to read", "SDP name"],
                "rows": [
                    ["G.711", "ITU-T G.711", "PCMU/8000 or PCMA/8000"],
                    ["G.729", "ITU-T G.729", "G729/8000"],
                    ["Opus", "RFC 6716, the Opus license, IETF IPR", "opus, clock from the payload format"],
                ],
            },
            sections=[
                sec(
                    "G.711 and G.729",
                    "G.711 is the ITU-T recommendation behind PCMU and PCMA, both at an RTP clock of 8000 and a payload rate of 64 kbit/s. They interoperate only when the offer and the answer select the same one, mu-law or A-law.",
                    "G.729 is the ITU-T recommendation named by rtpmap as G729/8000, static payload type 18, and you read that recommendation before you deploy it. This course does not state a patent date or a licensing result for G.729.",
                    "g711", "g729", "3551",
                ),
                sec(
                    "Opus, the RFC, and the license",
                    "Opus is specified in RFC 6716, and offers name it with an rtpmap encoding of opus, commonly opus/48000/2. The payload type number is dynamic, so the match is still the encoding name and not a fixed number.",
                    "Read RFC 6716 and the Opus license, and check the IETF IPR disclosures, before you decide what the license allows. This lesson stops at that reading and does not state a further legal conclusion.",
                    "6716", "opus", "ietf-ipr",
                ),
            ],
            flow=ladder(
                "Pick a shared name",
                ["Alice", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "The offer lists opus on payload 96 and G722/8000 on payload 9. G.711 is not in this particular offer.", invite(ALICE, CARRIER, body=OFFER_RTPMAP)),
                    (1, 0, "100", "res", "Trying does not choose a codec.", trying()),
                    (1, 0, "200", "res", "The answer names opus on payload 111 and keeps G722/8000. The shared names are the selection.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_RTPMAP)),
                    (0, 1, "ACK", "req", "ACK confirms the dialog. It does not add G.729 or change the license of Opus.", sip(
                        f"ACK sip:bob@{CARRIER} SIP/2.0",
                        [
                            f"Via: SIP/2.0/UDP {ALICE};branch=z9hG4bKackcodec",
                            "Max-Forwards: 70",
                            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
                            "To: <sip:+15551212@example.com>;tag=314159",
                            "Call-ID: a84b4c76e66710@example.com",
                            "CSeq: 1 ACK",
                        ],
                    )),
                ],
            ),
            quiz=[
                quiz_item("PCMU and PCMA come from", ["ITU-T G.711", "RFC 6716", "RFC 4733", "RFC 8225"], 0, "G.711 is the recommendation. PCMU is mu-law and PCMA is A-law.", "g711"),
                quiz_item("G729/8000 refers to", ["ITU-T G.729", "Opus", "A SIP method", "STUN"], 0, "Read the ITU-T recommendation. Do not invent a patent date.", "g729"),
                quiz_item("Opus is specified by", ["RFC 6716", "RFC 3550 alone", "RFC 4568", "ITU-T G.711"], 0, "Then read the license and the IETF IPR disclosures. Stop before a legal conclusion.", "6716"),
                quiz_item("This lesson's conclusion about Opus rights is", ["Read the RFC and the license. No further legal conclusion is stated", "A licensing result stated as a course fact", "Opus is payload type 0", "Opus uses the G.722 clock rule"], 0, "The license URL and the IETF IPR page are the places to look.", "opus"),
                quiz_item("A shared codec is selected by", ["Encoding name, not by hoping the payload type numbers match", "The lowest UDP port", "The From display name", "RTCP alone"], 0, "opus on 96 and opus on 111 are the same encoding name.", "3264"),
                quiz_item("Where are IETF IPR disclosures listed?", ["The IETF IPR disclosure page", "Inside every RTP marker bit", "RFC 3581", "The ptime attribute"], 0, "Use that page together with the Opus license and RFC 6716.", "ietf-ipr"),
            ],
            cards=[
                card("G.711", "PCMU/8000 and PCMA/8000. Read ITU-T G.711. They are not interchangeable.", "g711"),
                card("G.729", "rtpmap G729/8000, static PT 18. Read ITU-T G.729. This course states no licensing result.", "g729"),
                card("Opus", "RFC 6716. Read the RFC and the license.", "6716"),
                card("IPR", "Check IETF IPR disclosures. This course states no legal result.", "ietf-ipr"),
            ],
            lab=make_lab(
                "See opus survive a new payload type",
                "sdp",
                "Negotiate the offer and answer. Confirm opus matches across payload types 96 and 111, and that G722 stays at 8000.",
                ["Press Negotiate.", "Record both opus payload type numbers.", "Read the G722 clock."],
                "What must you read before stating what the Opus license allows?",
                ["RFC 6716 and the Opus license", "Only the payload type number", "RFC 3581", "A licensing result invented by this course"],
                0,
                "Also check IETF IPR disclosures. This lab states no further legal conclusion.",
                "6716",
                offer=OFFER_RTPMAP,
                answer=ANSWER_RTPMAP,
            ),
            fault=make_fault(
                "PCMA answered to a PCMU-only offer",
                "The offer lists payload 0 only. The answer lists payload 8 only. Both sides claim G.711 and nobody hears audio.",
                "offer m=audio 49170 RTP/AVP 0\noffer a=rtpmap:0 PCMU/8000\nanswer m=audio 40000 RTP/AVP 8\nanswer a=rtpmap:8 PCMA/8000\n",
                ["PCMU and PCMA are different encodings, so this answer selected nothing in common", "PT 0 and PT 8 are defined to be identical", "The fix is to set the G.722 clock to 16000", "Opus requires payload 8"],
                0,
                "G.711 includes both laws. RFC 3551 gives them different payload types.",
                "The answerer treated every G.711 payload type as interchangeable.",
                "Answer with PCMU if that is what was offered, or offer both PCMU and PCMA when the peer might be on either law. Read ITU-T G.711 for the codec, not a payload-type shortcut.",
                "3551", "g711",
            ),
        ),
        lesson(
            L,
            id="rtcp",
            title="RTCP sender and receiver reports",
            minutes=12,
            tags=["rtcp", "rfc3550", "loss"],
            summary="RTCP sender reports and receiver reports describe the RTP flow. A SIP 200 OK does not report loss.",
            objectives=[
                "Distinguish sender reports from receiver reports",
                "Look in RTCP for loss and jitter",
                "Pair RTCP with the RTP port using the RFC 3550 default",
            ],
            illustration={
                "type": "table",
                "title": "What a report is for",
                "caption": "RFC 3550 pairs RTCP with RTP. SIP status codes are not a substitute.",
                "columns": ["Report", "When", "What you learn"],
                "rows": [
                    ["Sender report", "The participant has been sending RTP", "Packet count, octet count, NTP and RTP timestamps"],
                    ["Receiver report", "The participant is reporting reception", "Fraction lost, cumulative loss, jitter"],
                ],
            },
            sections=[
                sec(
                    "SR and RR",
                    "RFC 3550 defines RTCP sender reports and receiver reports. A sender report is used when that participant has recently sent RTP, and it includes sender packet and octet counts plus reception reports.",
                    "A receiver report carries reception reports without that sender block. Fraction lost, cumulative packets lost, and interarrival jitter are how you see damage that a SIP 200 OK will never mention.",
                    "3550",
                ),
                sec(
                    "Where the packets go",
                    "RFC 3550 says RTP should use an even port and RTCP the next higher port. When you capture media, open that pair before you declare the call healthy.",
                    "One-way RTP often shows a sender report from only one side. Combine that fact with the SDP direction and the c= address, and use the Wireshark RTP display-filter reference when you slice the capture.",
                    "3550", "ws-rtp",
                ),
            ],
            flow=ladder(
                "Reports follow the answer",
                ["Alice", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "The offer port 49170 is the RTP port. RTCP defaults to the next higher port, 49171.", invite(ALICE, CARRIER, body=OFFER_PTIME)),
                    (1, 0, "100", "res", "Trying is not an RTCP report.", trying()),
                    (1, 0, "200", "res", "The answer port 40030 is RTP. RTCP from the carrier defaults to 40031. Loss will appear there, not in this 200 OK.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_PTIME)),
                    (0, 1, "ACK", "req", "ACK closes the offer/answer. Sender and receiver reports start with the media, on the RTCP ports.", sip(
                        f"ACK sip:bob@{CARRIER} SIP/2.0",
                        [
                            f"Via: SIP/2.0/UDP {ALICE};branch=z9hG4bKackrtcp",
                            "Max-Forwards: 70",
                            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
                            "To: <sip:+15551212@example.com>;tag=314159",
                            "Call-ID: a84b4c76e66710@example.com",
                            "CSeq: 1 ACK",
                        ],
                    )),
                ],
            ),
            quiz=[
                quiz_item("A sender report is sent when", ["That participant has recently sent RTP", "SIP returns 180", "The digest nonce expires", "The m-line port is 0"], 0, "SR includes sender counters. RR is the report without that sender block.", "3550"),
                quiz_item("Fraction lost is found in", ["RTCP reception reports", "The SIP Reason header only", "a=ptime", "The Via branch"], 0, "A 200 OK cannot tell you the loss fraction.", "3550"),
                quiz_item("The default RTCP port is", ["The next higher port after RTP", "5060", "The SIP TLS port", "Always port 9"], 0, "RFC 3550 pairs them that way. Capture both.", "3550"),
                quiz_item("Jitter in a receiver report measures", ["Interarrival jitter of RTP", "SIP retransmissions of INVITE", "DNS SRV weight", "The G.722 sample rate"], 0, "It is a media statistic. It is not a SIP timer.", "3550"),
                quiz_item("A sender report includes", ["Sender packet count and octet count", "The SIP Authorization username", "The STIR attest level", "An ICE candidate type"], 0, "Those counters are how you see that a side is actually sending.", "3550"),
                quiz_item("To filter a capture for RTP, start from", ["The Wireshark RTP display-filter reference", "The SDP v= line alone", "RFC 3323", "A router ACL from this lesson"], 0, "The reference lists the display filters. Loss details are still in RTCP.", "ws-rtp"),
            ],
            cards=[
                card("SR", "Sender report. Used when this participant has sent RTP.", "3550"),
                card("RR", "Receiver report. Fraction lost, cumulative loss, jitter.", "3550"),
                card("Port pair", "RTP on an even port, RTCP on the next higher port, by default.", "3550"),
                card("Not SIP", "200 OK does not carry fraction lost.", "3550"),
            ],
            lab=make_lab(
                "Name the RTCP port",
                "dissect",
                "The answer says m=audio 40030. Apply the RFC 3550 default and name the RTCP port.",
                ["Dissect the 200 OK.", "Read the m= port.", "Add one for the default RTCP port."],
                "The default RTCP port for RTP port 40030 is",
                ["40031", "40030", "5061", "0"],
                0,
                "RFC 3550 uses the next higher port unless a different mapping is given.",
                "3550",
                message=response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_PTIME),
            ),
            fault=make_fault(
                "Choppy audio with a perfect 200 OK",
                "SIP shows 200 OK and the caller says words are missing. Nobody opened RTCP.",
                "SIP/2.0 200 OK\nCSeq: 1 INVITE\nm=audio 40030 RTP/AVP 0\n"
                "RTCP RR fraction lost=25 on UDP 40031\nSR packet count from 192.0.2.40 only\n",
                ["RTCP shows loss that the 200 OK cannot show", "Fraction lost is a SIP status code", "Port 40031 means the stream was rejected", "A sender report replaces RTP"],
                0,
                "Receiver reports carry fraction lost and jitter. Sender reports show who is actually sending.",
                "The ticket stopped at the SIP status line.",
                "Capture RTP and the next-higher RTCP port. Read sender and receiver reports before you change codecs or headers.",
                "3550", "ws-rtp",
            ),
        ),
    ]
    lessons.extend(_rtp_rest(L, info_dtmf, one_way_answer))
    return {
        "id": "rtp",
        "title": "RTP, codecs, and DTMF",
        "summary": "RTP headers, payload types, codec documents, RTCP, telephone-event, packet time, and one-way audio.",
        "level": L,
        "order": 6,
        "lessons": lessons,
    }
def _rtp_rest(L, info_dtmf, one_way_answer):
    kpml = sip(
        f"SUBSCRIBE sip:alice@{ALICE} SIP/2.0",
        [
            f"Via: SIP/2.0/UDP {CUBE};branch=z9hG4bKkpml01",
            "Max-Forwards: 70",
            f"From: <sip:app@example.com>;tag=kp1",
            f"To: <sip:alice@{ALICE}>",
            "Call-ID: kpml-1@example.com",
            "CSeq: 1 SUBSCRIBE",
            f"Contact: <sip:app@{CUBE}>",
            "Event: kpml",
            "Expires: 300",
            "Accept: application/kpml-response+xml",
        ],
    )
    return [
        lesson(
            L,
            id="telephone-event",
            title="telephone-event and other digit paths",
            minutes=15,
            tags=["dtmf", "rfc4733", "info"],
            summary="telephone-event is RFC 4733, a dynamic payload. Events 0 through 15 are DTMF. INFO and KPML are different tools.",
            objectives=[
                "Negotiate telephone-event in SDP by encoding name",
                "Limit DTMF events to 0 through 15",
                "Keep SIP INFO and KPML separate from RFC 4733",
            ],
            illustration={
                "type": "table",
                "title": "Three digit paths",
                "caption": "Only telephone-event is RTP. The others are signaling, and one of them is not an IETF body.",
                "columns": ["Path", "Document", "What it is"],
                "rows": [
                    ["telephone-event", "RFC 4733", "Dynamic RTP payload. Events 0-15 are DTMF"],
                    ["INFO", "RFC 6086", "A SIP method. Not the DTMF codec"],
                    ["application/dtmf-relay", "Vendor body", "Not an IETF standard"],
                    ["KPML", "RFC 4730", "SUBSCRIBE and NOTIFY for key presses"],
                ],
            },
            sections=[
                sec(
                    "A dynamic payload in SDP",
                    "RFC 4733 defines telephone-event, and it obsoletes RFC 2833. The RFC Editor status banner is the authority for that status. The encoding is negotiated in SDP as a dynamic payload type, so you match the rtpmap name telephone-event and you do not insist on one global payload type number.",
                    "Events 0 through 15 are the DTMF events. Event 16 is flash, so a fmtp range of 0-15 is the DTMF set and a range of 0-16 adds flash. The telephone-event clock follows the audio, commonly 8000 with G.711.",
                    "4733", "3551", "8866",
                ),
                sec(
                    "INFO is a different method",
                    "SIP INFO is specified in RFC 6086 as a mid-dialog method for application information, and it is not telephone-event. Seeing INFO on a call does not mean RFC 4733 was negotiated.",
                    "A body of application/dtmf-relay is a vendor body, not an IETF standard. Recognize it in a trace and do not describe it as the standards-track DTMF encoding. KPML, RFC 4730, is a third path that uses SUBSCRIBE and NOTIFY when an application wants digits in signaling.",
                    "6086", "4730", "4733",
                ),
            ],
            flow=ladder(
                "Digits in RTP, named in SDP",
                ["Alice", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "The offer lists PCMU and telephone-event on payload 101, fmtp 0-15.", invite(ALICE, CARRIER, body=OFFER_DTMF)),
                    (1, 0, "100", "res", "Trying does not negotiate telephone-event.", trying()),
                    (1, 0, "200", "res", "The answer uses payload 106 for the same encoding name telephone-event. DTMF events are 0 through 15.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_DTMF)),
                    (0, 1, "ACK", "req", "ACK completes signaling. Digit events, if any, are RTP packets of the negotiated telephone-event payload, not a second INVITE.", sip(
                        f"ACK sip:bob@{CARRIER} SIP/2.0",
                        [
                            f"Via: SIP/2.0/UDP {ALICE};branch=z9hG4bKackdtmf",
                            "Max-Forwards: 70",
                            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
                            "To: <sip:+15551212@example.com>;tag=314159",
                            "Call-ID: a84b4c76e66710@example.com",
                            "CSeq: 1 ACK",
                        ],
                    )),
                ],
            ),
            quiz=[
                quiz_item("telephone-event is specified by", ["RFC 4733", "RFC 6086", "RFC 4730", "RFC 3264 alone"], 0, "RFC 4733 obsoletes RFC 2833. The RFC Editor status banner is the authority for that status.", "4733"),
                quiz_item("Events 0 through 15 are", ["The DTMF events", "All of the RTP marker values", "Static payload types", "ICE candidate types"], 0, "Event 16 is flash, not one more DTMF digit.", "4733"),
                quiz_item("The payload type for telephone-event is", ["Dynamic, and matched by the rtpmap name", "Always 101 in every network", "Always 0", "Always 8"], 0, "101 and 106 can be the same encoding. Match telephone-event, not the number.", "4733"),
                quiz_item("SIP INFO is", ["RFC 6086, a separate method", "The rtpmap name for DTMF", "Required before telephone-event works", "A codec clock"], 0, "INFO does not replace RFC 4733.", "6086"),
                quiz_item("application/dtmf-relay is", ["A vendor body, not an IETF standard", "The media type in RFC 4733", "Required by RFC 3551 for PCMU", "An ICE candidate"], 0, "You may see it inside INFO. It is not the standards-track telephone-event payload.", "6086"),
                quiz_item("KPML is", ["RFC 4730", "RFC 4733", "RFC 3711", "A static payload type"], 0, "KPML uses SUBSCRIBE and NOTIFY. It is not the RTP telephone-event codec.", "4730"),
            ],
            cards=[
                card("RFC 4733", "telephone-event. Obsoletes RFC 2833. Trust the status banner.", "4733"),
                card("Events 0-15", "DTMF. Event 16 is flash.", "4733"),
                card("Dynamic PT", "Match the name telephone-event in SDP.", "4733"),
                card("Not INFO", "RFC 6086 is a method. application/dtmf-relay is a vendor body.", "6086"),
            ],
            lab=make_lab(
                "Negotiate telephone-event",
                "sdp",
                "The offer uses payload 101 and the answer uses payload 106. Both rtpmap lines say telephone-event/8000 and fmtp lists 0-15.",
                ["Press Negotiate.", "Find telephone-event on each side.", "Compare the payload type numbers and the fmtp range."],
                "Why is DTMF still negotiated when the payload type changes from 101 to 106?",
                ["Both sides name telephone-event", "101 and 106 are static DTMF types", "fmtp 0-15 means G.722", "INFO carried the mapping"],
                0,
                "telephone-event is a dynamic payload. Events 0 through 15 are DTMF.",
                "4733",
                offer=OFFER_DTMF,
                answer=ANSWER_DTMF,
            ),
            fault=make_fault(
                "Digits sent as a vendor INFO body",
                "Key presses never reach the far media path. The trace shows INFO with a vendor body and the SDP has no telephone-event line.",
                info_dtmf + "\nSDP m=audio 49170 RTP/AVP 0\nSDP a=rtpmap:0 PCMU/8000\n(no telephone-event rtpmap)\n",
                ["INFO with application/dtmf-relay is not RFC 4733 telephone-event", "application/dtmf-relay is the IETF standard DTMF payload", "Payload 0 means telephone-event", "KPML is the RTP header"],
                0,
                "RFC 6086 defines INFO. The body type application/dtmf-relay is a vendor convention, not an IETF standard, and it is not the telephone-event codec.",
                "The call negotiated PCMU only, so RFC 4733 events were never agreed, and digits were placed in a vendor INFO body instead.",
                "Offer telephone-event as a dynamic payload with fmtp 0-15 when you need DTMF in RTP. Use KPML, RFC 4730, when an application must collect digits in signaling. Do not treat the vendor body as the standard.",
                "4733", "6086", "4730",
            ),
        ),
        lesson(
            L,
            id="ptime",
            title="ptime, packet rate, and EF",
            minutes=13,
            tags=["ptime", "bandwidth", "ef"],
            summary="ptime is SDP. Twenty milliseconds of G.711 is 50 packets per second and 160 bytes of payload, plus headers. Voice sits in the EF class.",
            objectives=[
                "Read a=ptime as milliseconds of media per packet",
                "Compute the G.711 20 ms packet rate and payload size",
                "Place voice in EF using RFC 4594 and RFC 3246, without a router config",
            ],
            illustration={
                "type": "table",
                "title": "20 ms G.711",
                "caption": "Payload math is not a router configuration. EF is the service class, defined elsewhere.",
                "columns": ["Item", "Value"],
                "rows": [
                    ["ptime", "20 ms, from SDP"],
                    ["Packets per second", "50"],
                    ["Payload bytes", "160"],
                    ["Payload rate", "64 kbit/s"],
                    ["Extra", "IP, UDP, and RTP headers"],
                    ["Service class", "EF for voice, RFC 4594"],
                ],
            },
            sections=[
                sec(
                    "ptime is an SDP attribute",
                    "a=ptime gives the packetization time in milliseconds for that media stream. It is SDP, so it is negotiated in the offer and the answer, and it is not an RTP header field and not a SIP method.",
                    "Twenty milliseconds of G.711 is 50 packets per second. Each packet carries 160 bytes of payload, because 8000 samples per second times 0.020 seconds is 160 eight-bit samples, which is a 64 kbit/s payload. IP, UDP, and RTP headers sit on top of those 160 bytes.",
                    "8866", "3551",
                ),
                sec(
                    "Voice is in the EF class",
                    "RFC 4594 places voice in the Expedited Forwarding class, and RFC 3246 defines that per-hop behavior. Cite both when you say why voice is marked EF, and keep the marking decision in the operator's QoS design.",
                    "This lesson does not include a router configuration. ptime still changes the packet rate the marker has to carry: 20 ms is 50 packets per second, and a longer ptime sends fewer, larger packets.",
                    "4594", "3246", "8866",
                ),
            ],
            flow=ladder(
                "ptime sits in the offer",
                ["Alice", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "a=ptime:20 on G.711 means 160 payload bytes and 50 packets per second, plus headers.", invite(ALICE, CARRIER, body=OFFER_PTIME)),
                    (1, 0, "100", "res", "Trying does not change ptime.", trying()),
                    (1, 0, "200", "res", "The answer agrees to ptime 20. EF marking, if any, is a network policy, not a line in this SDP.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_PTIME)),
                    (0, 1, "ACK", "req", "ACK does not carry the IP header mark. Voice packets that follow are the ones RFC 4594 places in EF.", sip(
                        f"ACK sip:bob@{CARRIER} SIP/2.0",
                        [
                            f"Via: SIP/2.0/UDP {ALICE};branch=z9hG4bKackptime",
                            "Max-Forwards: 70",
                            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
                            "To: <sip:+15551212@example.com>;tag=314159",
                            "Call-ID: a84b4c76e66710@example.com",
                            "CSeq: 1 ACK",
                        ],
                    )),
                ],
            ),
            quiz=[
                quiz_item("ptime is", ["An SDP attribute, in milliseconds", "An RTP sequence number", "A SIP response code", "A DSCP router command"], 0, "Read it on the media stream. It is not a header in RTP.", "8866"),
                quiz_item("20 ms of G.711 produces", ["50 packets per second and 160 bytes of payload, plus headers", "20 packets per second and 20 bytes", "1 packet per second", "160 packets per second and 50 bytes"], 0, "8000 times 0.020 is 160 samples, and 1000/20 is 50.", "3551"),
                quiz_item("Those 160 bytes are", ["Payload. Headers are additional", "The entire Ethernet frame", "The SIP message", "An RTCP report"], 0, "IP, UDP, and RTP headers are extra. Do not treat 160 as the on-wire size.", "3551"),
                quiz_item("Voice in RFC 4594 is in which class?", ["EF", "A class this lesson invents a router ACL for", "The SIP Via class", "Port 0"], 0, "RFC 3246 defines the EF per-hop behavior. This lesson has no router configuration.", "4594"),
                quiz_item("RFC 3246 is cited because", ["It defines the EF per-hop behavior", "It defines SDP ptime", "It obsoletes G.711", "It assigns payload type 0"], 0, "Use it with RFC 4594. Do not invent a device config from the citation.", "3246"),
                quiz_item("A longer ptime", ["Sends fewer packets per second", "Changes the RTP version", "Removes the need for headers", "Sets the codec to G.722 clock 16000"], 0, "Packet rate is 1000 divided by ptime in milliseconds.", "8866"),
            ],
            cards=[
                card("a=ptime:20", "20 ms of media per packet. SDP, not RTP.", "8866"),
                card("50 and 160", "G.711 at 20 ms: 50 packets/s, 160 payload bytes, plus headers.", "3551"),
                card("EF", "Voice service class in RFC 4594.", "4594"),
                card("RFC 3246", "Defines the EF per-hop behavior. No router config in this lesson.", "3246"),
            ],
            lab=make_lab(
                "Read ptime 20",
                "sdp",
                "Both sides show a=ptime:20 and PCMU/8000. Compute packets per second and payload bytes.",
                ["Press Negotiate.", "Find a=ptime.", "Compute 1000/20 and 8000 times 0.020."],
                "20 ms G.711 payload size and rate are",
                ["160 bytes and 50 packets per second, plus headers", "1600 bytes and 5 packets per second", "8 bytes and 8000 packets per second", "A router ACL named EF"],
                0,
                "Headers are additional. EF is the class in RFC 4594, not a line of router configuration here.",
                "3551",
                offer=OFFER_PTIME,
                answer=ANSWER_PTIME,
            ),
            fault=make_fault(
                "Budgeting 160 bytes as the whole packet",
                "A capacity sheet reserves 64 kbit/s per call and the link saturates. ptime is 20 and the codec is G.711.",
                "a=ptime:20\na=rtpmap:0 PCMU/8000\nplanned size: 160 bytes end to end\nobserved: IP+UDP+RTP headers on every packet, 50 packets/s\n",
                ["160 bytes is payload only. Headers are extra, at 50 packets per second", "ptime 20 means 20 bytes", "EF forbids G.711", "The timestamp step is 20"],
                0,
                "G.711 at 20 ms is 160 payload bytes and 50 packets per second. Each packet also carries IP, UDP, and RTP headers.",
                "The plan counted the codec payload and ignored per-packet headers.",
                "Keep 160 bytes plus headers in the budget. Mark voice into the EF class per RFC 4594 and RFC 3246 inside the operator's existing QoS design, not from a config invented here.",
                "3551", "8866", "4594", "3246",
            ),
        ),
        lesson(
            L,
            id="one-way-audio",
            title="One-way audio",
            minutes=14,
            tags=["one-way", "direction", "rtp"],
            summary="A 200 OK can be perfect while one RTP direction is missing. Read direction, c=, and who is actually sending.",
            objectives=[
                "Separate a completed offer/answer from flowing RTP",
                "Check sendonly, recvonly, and inactive before blaming the codec",
                "Use RTCP to see which side is silent",
            ],
            illustration={
                "type": "states",
                "title": "What to check, in order",
                "caption": "Signaling success is the first box, not the last.",
                "nodes": ["200 OK", "Direction", "c= and ports", "RTCP"],
            },
            sections=[
                sec(
                    "Signaling can be done while one direction is not",
                    "One-way audio means RTP is arriving in one direction and not in the other. The SIP 200 OK only proves that an answer was delivered, so the next read is the direction attribute on each m-line.",
                    "An answer of sendonly means that answerer will send and does not want to receive. An answer of inactive means neither side sends. Either one produces a missing direction even when the codec name matched.",
                    "3264", "3550",
                ),
                sec(
                    "Then the path",
                    "If both directions are sendrecv and RTP still fails one way, compare the c= address and the m= port with the UDP packets you captured. The address in SDP is where the sender was told to transmit, and a packet that never arrives there is a path problem.",
                    "RTCP sender reports show which side has sent. Filter the capture with the Wireshark RTP display filters, and use the SIP display-filter reference for the signaling half. Do not change payload types until direction and path have been read.",
                    "3550", "ws-rtp", "ws-sip",
                ),
            ],
            flow=ladder(
                "Answer says sendonly",
                ["Alice", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "Alice offers sendrecv on PCMU. She will send and receive if the answer agrees.", invite(ALICE, CARRIER, body=OFFER_PTIME)),
                    (1, 0, "100", "res", "Trying does not set media direction.", trying()),
                    (1, 0, "200", "res", "The answer is sendonly. The carrier will send and will not receive Alice. That is one-way audio by negotiation.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=one_way_answer)),
                    (0, 1, "ACK", "req", "ACK does not repair the direction. A new offer is required if the call should be sendrecv.", sip(
                        f"ACK sip:bob@{CARRIER} SIP/2.0",
                        [
                            f"Via: SIP/2.0/UDP {ALICE};branch=z9hG4bKack1way",
                            "Max-Forwards: 70",
                            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
                            "To: <sip:+15551212@example.com>;tag=314159",
                            "Call-ID: a84b4c76e66710@example.com",
                            "CSeq: 1 ACK",
                        ],
                    )),
                ],
            ),
            quiz=[
                quiz_item("One-way audio with a 200 OK means", ["RTP is missing or suppressed in one direction", "SIP failed", "The Call-ID is wrong", "ptime must be 0"], 0, "Read direction, then c= and the ports, then RTCP.", "3550"),
                quiz_item("An answer of a=sendonly means the answerer will", ["Send and not receive", "Receive and not send", "Reject the stream", "Use G.722 at clock 16000"], 0, "That negotiation itself creates one direction.", "3264"),
                quiz_item("a=inactive means", ["Neither side sends that stream", "Both sides send", "The port is 5060", "RTCP is disabled by RFC 3550 always"], 0, "Inactive is also a common hold, and it sounds like silence.", "3264"),
                quiz_item("If direction is sendrecv on both sides, you next check", ["The c= address and whether RTP arrives on the m= port", "Only the From display name", "The digest algorithm", "Whether 100 Trying had SDP"], 0, "The SDP address is the destination the sender was given.", "3264"),
                quiz_item("A sender report from only one side shows", ["Only that side has been sending RTP", "The SIP dialog failed", "Port 0 was used", "telephone-event is mandatory"], 0, "RTCP counters are the media evidence.", "3550"),
                quiz_item("The Wireshark references in this lesson are for", ["RTP and SIP display filters", "Writing a router ACL", "Choosing an Opus license", "Replacing RFC 3550"], 0, "Use them to slice the capture after you know the ports.", "ws-rtp"),
            ],
            cards=[
                card("200 OK", "Offer/answer finished. It does not prove both RTP directions.", "3264"),
                card("sendonly answer", "Answerer sends, does not receive. One-way by negotiation.", "3264"),
                card("c= and port", "The destination you must capture.", "8866"),
                card("SR from one side", "The other side is not sending, according to RTCP.", "3550"),
            ],
            lab=make_lab(
                "Spot sendonly in the answer",
                "capture",
                "Extract the INVITE and the 200 OK. Compare a=sendrecv in the offer with the answer direction.",
                ["Press Extract SIP.", "Read the offer direction.", "Read the answer direction."],
                "This answer produces one-way audio because it is",
                ["sendonly", "sendrecv", "missing a Call-ID", "using payload type 18"],
                0,
                "The offer was sendrecv. The answerer will send and will not receive.",
                "3264",
                message="Sent:\n" + invite(ALICE, CARRIER, body=OFFER_PTIME) + "\nReceived:\n" + response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=one_way_answer),
            ),
            fault=make_fault(
                "Silence toward the caller, media toward the callee",
                "The callee hears the caller. The caller hears nothing. SIP is 200 OK.",
                f"offer a=sendrecv\nanswer a=recvonly\nc=IN IP4 {CARRIER}\nm=audio 40060 RTP/AVP 0\n"
                "RTP from 203.0.113.10 arrives\nRTP from 192.0.2.40 is absent\nRTCP SR only from 203.0.113.10\n",
                ["The answer is recvonly, so the answerer does not send", "recvonly means the offer was illegal", "Missing RTP from the carrier is a digest failure", "The fix is to set the G.722 clock to 16000"],
                0,
                "recvonly is the answerer's direction. They receive and they do not send, which matches a sender report from only 203.0.113.10.",
                "The stream was negotiated one way. The packet capture agrees with the SDP.",
                "If the call should be two-way, send a new offer with sendrecv and require a sendrecv answer. If this is hold, sendonly or inactive was the wrong shape for what users expect, so correct the direction rather than the codec.",
                "3264", "3550",
            ),
        ),
    ]
def security_track():
    L = "Advanced"
    challenge_407 = response(
        407,
        "Proxy Authentication Required",
        CUBE,
        extra=['Proxy-Authenticate: Digest realm="example.com", nonce="c0ffee01", algorithm=SHA-256, qop="auth"'],
        to_tag="p407",
    )
    challenge_401 = response(
        401,
        "Unauthorized",
        CUCM,
        extra=['WWW-Authenticate: Digest realm="example.com", nonce="c0ffee02", algorithm=SHA-256, qop="auth"'],
        to_tag="u401",
        via_host=CUBE,
    )
    retry_proxy = invite(
        ALICE,
        CUBE,
        extra=['Proxy-Authorization: Digest realm="example.com", username="alice", algorithm=SHA-256, uri="sip:+15551212@example.com", response="not-computed"'],
        branch="z9hG4bKauth02",
        cseq=2,
    )
    tls_invite = invite(ALICE, CARRIER, transport="TLS", extra=["Supported: 100rel"])
    pai_msg = invite(
        CUBE,
        CARRIER,
        extra=[
            "Privacy: id",
            "P-Asserted-Identity: <sip:alice@example.com>",
            "P-Preferred-Identity: <sip:alice@example.com>",
        ],
        branch="z9hG4bKpai01",
    )
    lessons = [
        lesson(
            L,
            id="digest",
            title="401, 407, and digest",
            minutes=13,
            tags=["digest", "401", "407"],
            summary="A 401 from a UAS is answered with Authorization. A 407 from a proxy is answered with Proxy-Authorization.",
            objectives=[
                "Pair 401 with Authorization and WWW-Authenticate",
                "Pair 407 with Proxy-Authorization and Proxy-Authenticate",
                "Stop at the header split and do not compute an attack",
            ],
            illustration={
                "type": "table",
                "title": "Which challenge uses which header",
                "caption": "RFC 3261 section 22 is the SIP rule. RFC 7616 is the HTTP digest specification for algorithms.",
                "columns": ["Status", "Who sends it", "Challenge", "Client header"],
                "rows": [
                    ["401", "UAS", "WWW-Authenticate", "Authorization"],
                    ["407", "Proxy", "Proxy-Authenticate", "Proxy-Authorization"],
                ],
            },
            sections=[
                sec(
                    "Two challenges, two headers",
                    "RFC 3261 section 22 defines SIP digest and the two challenge statuses that use it. A UAS that needs to authenticate the user sends 401 Unauthorized and a WWW-Authenticate header, and the client retries with Authorization.",
                    "A proxy that needs to authenticate the user sends 407 Proxy Authentication Required and a Proxy-Authenticate header, and the client retries with Proxy-Authorization. A 401 does not ask for Proxy-Authorization, and a 407 does not ask for Authorization.",
                    "3261-22", "7616",
                ),
                sec(
                    "Algorithms, not a worked attack",
                    "The challenge names the realm and the algorithm. RFC 7616 is the HTTP digest specification that adds algorithms such as SHA-256, and many challenges still show an older algorithm, so you read the parameter instead of assuming SHA-256.",
                    "The Authorization or Proxy-Authorization header carries a digest response, not the password in the clear. This lesson stops at which header answers which status. It does not compute that digest and it does not describe an attack.",
                    "7616", "3261-22",
                ),
            ],
            flow=ladder(
                "407 first, then a 401",
                ["Alice", "Proxy", "UAS"],
                [
                    (0, 1, "INVITE", "req", "The first INVITE has no digest header. The proxy has not authenticated Alice.", invite(ALICE, CUBE)),
                    (1, 0, "407", "res", "407 from the proxy. The matching client header on the retry is Proxy-Authorization.", challenge_407),
                    (0, 1, "INVITE", "req", "The retry carries Proxy-Authorization. The response value here is the placeholder not-computed, so this trace is not a usable credential.", retry_proxy),
                    (2, 1, "401", "res", "The UAS still wants the user authenticated. 401 uses WWW-Authenticate, and the client answer is Authorization, while Proxy-Authorization stays in the request for the proxy.", challenge_401),
                ],
            ),
            quiz=[
                quiz_item("A 407 is answered with", ["Proxy-Authorization", "Authorization", "WWW-Authenticate", "a=crypto"], 0, "407 comes from a proxy. The challenge header is Proxy-Authenticate.", "3261-22"),
                quiz_item("A 401 is answered with", ["Authorization", "Proxy-Authorization", "Proxy-Authenticate", "Identity"], 0, "401 comes from a UAS. The challenge header is WWW-Authenticate.", "3261-22"),
                quiz_item("RFC 7616 is", ["The HTTP digest specification, including newer algorithms such as SHA-256", "The SDP offer/answer model", "The RTP header", "STUN"], 0, "Read the algorithm parameter. Do not assume every peer sends SHA-256.", "7616"),
                quiz_item("The digest response in the client header is", ["Not the password in the clear. This lesson does not compute it", "The user's password copied into SDP", "An RTP sequence number", "A certificate private key"], 0, "Stop at the header split in RFC 3261 section 22.", "3261-22"),
                quiz_item("Proxy-Authenticate appears on", ["407", "401", "180", "200"], 0, "WWW-Authenticate appears on the 401 from the UAS.", "3261-22"),
                quiz_item("After a proxy accepts the hop, a UAS may still send", ["401, which requires Authorization", "Another 407 that requires Authorization", "183 with no further rules", "Port 0 in a header"], 0, "The two challenges can both happen. Keep their headers separate.", "3261-22"),
            ],
            cards=[
                card("401", "From the UAS. Challenge is WWW-Authenticate. Retry with Authorization.", "3261-22"),
                card("407", "From the proxy. Challenge is Proxy-Authenticate. Retry with Proxy-Authorization.", "3261-22"),
                card("RFC 7616", "HTTP digest algorithms. Read the algorithm parameter.", "7616"),
                card("Stop here", "Identify the header. Do not compute a digest in this lesson.", "3261-22"),
            ],
            lab=make_lab(
                "Read a 407",
                "dissect",
                "Dissect the 407. Name the challenge header and the header the client must send next.",
                ["Press Dissect.", "Read the status line.", "Find Proxy-Authenticate and note there is no computed response."],
                "Which header answers this 407?",
                ["Proxy-Authorization", "Authorization", "P-Asserted-Identity", "a=fingerprint"],
                0,
                "A proxy challenge uses Proxy-Authenticate and is answered with Proxy-Authorization.",
                "3261-22",
                message=challenge_407,
            ),
            fault=make_fault(
                "401 retried with the proxy header",
                "A UAS returned 401 with WWW-Authenticate. The next INVITE adds only Proxy-Authorization, and the UAS challenges again.",
                "SIP/2.0 401 Unauthorized\n"
                'WWW-Authenticate: Digest realm="example.com", nonce="c0ffee02", algorithm=SHA-256, qop="auth"\n'
                "next request has Proxy-Authorization and no Authorization\n",
                ["A 401 is answered with Authorization, not with Proxy-Authorization", "401 and 407 use the same client header", "SHA-256 means the password is written in SDP", "The nonce belongs in c="],
                0,
                "RFC 3261 section 22 splits the UAS challenge from the proxy challenge.",
                "The client treated every digest challenge as a proxy challenge.",
                "On 401, send Authorization built for that WWW-Authenticate challenge. On 407, send Proxy-Authorization. Read the algorithm from the challenge. Do not place the password in the trace.",
                "3261-22", "7616",
            ),
        ),
        lesson(
            L,
            id="tls-certs",
            title="TLS and domain certificates",
            minutes=14,
            tags=["tls", "rfc5922", "certs"],
            summary="SIP over TLS is RFC 3261 section 18. The certificate has to identify the SIP domain, per RFC 5922.",
            objectives=[
                "Treat TLS as a transport for the same SIP messages",
                "Check the certificate against the SIP domain",
                "Refuse a name that is only a nearby web host",
            ],
            illustration={
                "type": "layers",
                "title": "What TLS is protecting",
                "caption": "TLS covers the SIP messages on that connection. It does not by itself choose SRTP.",
                "layers": [
                    {"name": "SIP", "detail": "Same methods, Via transport TLS"},
                    {"name": "TLS", "detail": "RFC 3261 section 18, often port 5061"},
                    {"name": "Certificate", "detail": "Must identify the SIP domain, RFC 5922"},
                ],
            },
            sections=[
                sec(
                    "TLS carries SIP",
                    "RFC 3261 section 18 allows SIP over TLS. The request line and the headers are the same protocol, the Via transport token is TLS, and the usual port is 5061.",
                    "A sip URI with transport=tls and a sips URI both tell you to expect TLS, and they are not a statement that the media is SRTP. Media protection is negotiated in SDP and is a later lesson.",
                    "3261-18", "3261",
                ),
                sec(
                    "The certificate names the SIP domain",
                    "RFC 5922 requires the certificate to identify the SIP domain the client intended to reach. Compare that identity with example.com when example.com is the domain you looked up, and reject a certificate that only names a different host.",
                    "A certificate for files.example.com does not identify the SIP domain example.com. Operators confirm the name with the peer's documented domain before they enable the trunk, and they do not accept a raw address that was never in the certificate.",
                    "5922", "3261-18",
                ),
            ],
            flow=ladder(
                "INVITE over TLS",
                ["Alice", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "Via says SIP/2.0/TLS. The method is still INVITE. The certificate check is RFC 5922, against example.com.", tls_invite),
                    (1, 0, "100", "res", "Trying on the same TLS connection. It does not skip the name check that already happened.", trying(transport="TLS")),
                    (1, 0, "180", "res", "180 Ringing is still a SIP response. TLS did not change its meaning.", response(180, "Ringing", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER};transport=tls>"])),
                    (1, 0, "200", "res", "200 OK can carry SDP. SRTP, if any, is in that body, not implied by the transport.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER};transport=tls>"], body=SDP_OK)),
                ],
            ),
            quiz=[
                quiz_item("SIP over TLS is specified in", ["RFC 3261 section 18", "RFC 3550", "RFC 4733", "RFC 8445"], 0, "The messages stay SIP. The transport is TLS.", "3261-18"),
                quiz_item("RFC 5922 checks", ["That the certificate identifies the SIP domain you meant to reach", "The RTP sequence number", "The ptime value", "The digest nonce length only"], 0, "files.example.com is not the domain example.com.", "5922"),
                quiz_item("The usual SIP TLS port in RFC 3261 is", ["5061", "5060", "443 only", "49170"], 0, "5060 is the usual UDP and TCP port. Confirm the peer's document anyway.", "3261-18"),
                quiz_item("A successful TLS handshake means", ["The signaling connection matched the certificate rules you applied", "The media is automatically SRTP", "Digest is no longer defined", "SDP can omit c="], 0, "SRTP is a separate negotiation.", "3261-18"),
                quiz_item("Via on a TLS hop shows", ["SIP/2.0/TLS", "SIP/2.0/SRTP", "SIP/2.0/DTMF", "SIP/2.0/ICE"], 0, "SRTP is not a Via transport.", "3261-18"),
                quiz_item("A certificate that names only files.example.com, for a request to example.com,", ["Fails the RFC 5922 domain check", "Is always acceptable", "Satisfies the check because both end in example", "Replaces the need for SDP"], 0, "The identity is the SIP domain the client intended.", "5922"),
            ],
            cards=[
                card("RFC 3261 §18", "SIP over TLS. Same methods. Via transport TLS.", "3261-18"),
                card("5061", "Usual TLS port in RFC 3261.", "3261-18"),
                card("RFC 5922", "The certificate must identify the SIP domain.", "5922"),
                card("Not SRTP", "TLS on SIP does not select the media keying method.", "3261-18"),
            ],
            lab=make_lab(
                "Read a TLS Via",
                "dissect",
                "Dissect the INVITE. The transport is TLS. The domain in the request is example.com.",
                ["Press Dissect.", "Read Via.", "Name the domain RFC 5922 must find in the certificate."],
                "Which domain must the certificate identify for this request?",
                ["example.com", "files.example.com", "The RTP payload type", "The nonce c0ffee01"],
                0,
                "RFC 5922 binds the certificate to the SIP domain you are trying to reach.",
                "5922",
                message=tls_invite,
            ),
            fault=make_fault(
                "Web name on a SIP trunk",
                "TLS to example.com fails. The certificate presented on 5061 names a different host.",
                "target SIP domain: example.com\n"
                "peer 192.0.2.40 port 5061\n"
                "certificate SAN DNS:files.example.com\n"
                "result: name mismatch\n",
                ["The certificate does not identify the SIP domain example.com", "Any name under example.com is enough", "Port 5061 means skip RFC 5922", "A mismatch is fixed by deleting Via"],
                0,
                "RFC 5922 compares the certificate with the SIP domain the client intended to reach.",
                "The trunk presented a certificate for files.example.com.",
                "Install a certificate that identifies example.com and confirm that name with the peer before you enable the trunk. Do not disable the name check to force the call up.",
                "5922", "3261-18",
            ),
        ),
        lesson(
            L,
            id="srtp-keying",
            title="SRTP and two keying methods",
            minutes=15,
            tags=["srtp", "sdes", "dtls-srtp"],
            summary="SRTP is RFC 3711. SDES a=crypto is RFC 4568. DTLS-SRTP is RFC 5764. An SBC must not assume peers share one method.",
            objectives=[
                "Separate SRTP from the way keys are obtained",
                "Name SDES and DTLS-SRTP as different keying methods",
                "Key each SBC leg with the method that leg negotiated",
            ],
            illustration={
                "type": "table",
                "title": "Packet protection versus keying",
                "caption": "Copying one leg's keying line onto the other leg is the failure this lesson prevents.",
                "columns": ["Piece", "RFC", "Where it appears"],
                "rows": [
                    ["SRTP", "3711", "Encrypted and authenticated RTP"],
                    ["SDES", "4568", "a=crypto in SDP"],
                    ["DTLS-SRTP", "5764", "DTLS on the media path, fingerprint in SDP"],
                ],
            },
            sections=[
                sec(
                    "SRTP is not the key exchange",
                    "RFC 3711 defines SRTP, which encrypts and authenticates RTP and keeps the sequence number, timestamp, and SSRC in the packet. The profile token RTP/SAVP is SRTP, and it does not interchange with RTP/AVP.",
                    "Keying is a separate decision from the SRTP packet format itself. SDES, RFC 4568, puts the keying material in an a=crypto line inside SDP, so that line is only as private as the signaling path that carries it, and you use it on TLS when you use it at all.",
                    "3711", "4568", "3261-18",
                ),
                sec(
                    "DTLS-SRTP is the other method",
                    "DTLS-SRTP, RFC 5764, runs DTLS on the media path and derives the SRTP keys there. SDP carries a fingerprint so each side can check the certificate used in that handshake, and the profile token is UDP/TLS/RTP/SAVP rather than a bare RTP/AVP line.",
                    "An SBC must not assume two peers share one keying method. If one leg offers SDES and the other offers DTLS-SRTP, the SBC keys each leg with the method that leg negotiated and does not paste a=crypto onto the DTLS leg or paste a fingerprint onto a peer that asked for SDES.",
                    "5764", "4568", "3711",
                ),
            ],
            flow=ladder(
                "Two legs, two methods",
                ["Peer A", "SBC", "Peer B"],
                [
                    (0, 1, "INVITE", "req", "Peer A offers RTP/SAVP. That is SRTP. Keying on this leg is SDES, a=crypto, and the key material is not printed in this ladder.", invite(ALICE, CUBE, body=SRTP_OFFER)),
                    (1, 0, "100", "res", "Trying does not choose a keying method.", trying()),
                    (1, 2, "INVITE", "req", "Peer B is a different peer. This synthetic offer uses UDP/TLS/RTP/SAVP and a fingerprint, which is DTLS-SRTP. The SBC must not reuse Peer A's method.", sip(
                        f"INVITE sip:+15551212@{CARRIER} SIP/2.0",
                        [
                            f"Via: SIP/2.0/TLS {CUBE};branch=z9hG4bKsrtp02",
                            "Max-Forwards: 69",
                            'From: "Alice" <sip:alice@example.com>;tag=sbc1',
                            "To: <sip:+15551212@example.com>",
                            "Call-ID: b2b-srtp@example.com",
                            "CSeq: 1 INVITE",
                            f"Contact: <sip:sbc@{CUBE};transport=tls>",
                            "Content-Type: application/sdp",
                        ],
                        "v=0\n"
                        f"o=sbc 1 1 IN IP4 {CUBE}\n"
                        "s=-\n"
                        f"c=IN IP4 {CUBE}\n"
                        "t=0 0\n"
                        "m=audio 19642 UDP/TLS/RTP/SAVP 0\n"
                        "a=rtpmap:0 PCMU/8000\n"
                        "a=fingerprint:sha-256 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF\n"
                        "a=setup:actpass\n"
                        "a=sendrecv\n",
                    )),
                    (2, 1, "200", "res", "Peer B answers the DTLS-SRTP profile. The SBC still has to finish SDES toward Peer A. One shared key is not assumed.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER};transport=tls>"], body=(
                        "v=0\n"
                        f"o=bob 2 2 IN IP4 {CARRIER}\n"
                        "s=-\n"
                        f"c=IN IP4 {CARRIER}\n"
                        "t=0 0\n"
                        "m=audio 40040 UDP/TLS/RTP/SAVP 0\n"
                        "a=rtpmap:0 PCMU/8000\n"
                        "a=fingerprint:sha-256 11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00\n"
                        "a=setup:active\n"
                        "a=sendrecv\n"
                    ))),
                ],
            ),
            quiz=[
                quiz_item("SRTP is", ["RFC 3711", "RFC 4568", "RFC 5764", "RFC 3323"], 0, "4568 and 5764 are keying methods. 3711 is the protected RTP.", "3711"),
                quiz_item("a=crypto is", ["SDES, RFC 4568", "DTLS-SRTP", "A digest challenge", "An ICE candidate"], 0, "The keying material rides in SDP, so the signaling path has to protect it.", "4568"),
                quiz_item("DTLS-SRTP is", ["RFC 5764", "RFC 4568", "RFC 3551", "RFC 3581"], 0, "Keys come from DTLS on the media path. SDP carries a fingerprint.", "5764"),
                quiz_item("RTP/AVP and RTP/SAVP", ["Do not interchange", "Are the same profile", "Both mean plaintext", "Both mean DTLS-SRTP"], 0, "RTP/SAVP is SRTP. RTP/AVP is not.", "3711"),
                quiz_item("An SBC between SDES and DTLS-SRTP should", ["Key each leg with the method that leg negotiated", "Copy a=crypto onto both legs", "Assume both peers already share one master key", "Delete c= to force plaintext"], 0, "The peers did not agree to one method. The SBC terminates and re-keys.", "5764"),
                quiz_item("SDES keying material in SDP requires", ["A protected signaling path, such as TLS, if you use SDES", "That DTLS be skipped on every peer", "A public posting of the key", "Payload type 9"], 0, "RFC 4568 puts secrets in the signaling. Do not print them in tickets.", "4568"),
            ],
            cards=[
                card("RFC 3711", "SRTP. Protects RTP. Profile RTP/SAVP.", "3711"),
                card("RFC 4568", "SDES. a=crypto in SDP. Protect the signaling.", "4568"),
                card("RFC 5764", "DTLS-SRTP. Keys from DTLS. Fingerprint in SDP.", "5764"),
                card("Per leg", "Do not assume two peers share one keying method.", "5764"),
            ],
            lab=make_lab(
                "See the profile mismatch",
                "sdp",
                "The offer is RTP/SAVP. The answer is RTP/AVP. Negotiate and read the profile warning.",
                ["Press Negotiate.", "Compare the profile tokens.", "State which profile is SRTP."],
                "Why is this answer not SRTP toward the offerer?",
                ["The answer profile is RTP/AVP, which does not interchange with RTP/SAVP", "RTP/AVP means DTLS-SRTP", "Both profiles share a=crypto automatically", "Port numbers differ, so the profiles match"],
                0,
                "SRTP uses RTP/SAVP. An SBC still has to key each real leg with the method that leg actually offered.",
                "3711",
                offer=SRTP_OFFER,
                answer=SRTP_ANSWER_MISMATCH,
            ),
            fault=make_fault(
                "One keying line copied to both peers",
                "Peer A negotiated SDES. Peer B negotiated DTLS-SRTP. The SBC forwarded Peer A's a=crypto line onto Peer B and media stays silent.",
                "leg A m=audio 49170 RTP/SAVP 0\n"
                "leg A a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:<withheld>\n"
                "leg B m=audio 40040 UDP/TLS/RTP/SAVP 0\n"
                "leg B a=fingerprint:sha-256 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF\n"
                "leg B a=setup:actpass\n"
                "SBC copied the a=crypto line onto leg B\n",
                ["The legs use different keying methods and must be keyed separately", "a=crypto and a fingerprint are the same method", "Copying the line is required by RFC 3711", "Silence means the SIP Call-ID collided"],
                0,
                "SDES is RFC 4568. DTLS-SRTP is RFC 5764. SRTP itself is RFC 3711.",
                "The SBC assumed the peers shared one keying method and pasted SDP keying from one leg onto the other.",
                "Terminate media on the SBC and complete SDES only with the SDES peer and DTLS-SRTP only with the DTLS-SRTP peer. Keep key material out of tickets. Protect any SDES signaling with TLS.",
                "3711", "4568", "5764",
            ),
        ),
    ]
    lessons.extend(_security_rest(L, pai_msg))
    return {
        "id": "security",
        "title": "TLS, SRTP, identity, and abuse",
        "summary": "Defensive digest, TLS certificates, SRTP keying, privacy headers, STIR, and abuse controls.",
        "level": L,
        "order": 7,
        "lessons": lessons,
    }
def _security_rest(L, pai_msg):
    unsigned = invite(ALICE, CARRIER, branch="z9hG4bKstir01")
    register_ok_bad = sip(
        "SIP/2.0 200 OK",
        [
            f"Via: SIP/2.0/UDP {CARRIER};branch=z9hG4bKregbad",
            "From: <sip:alice@example.com>;tag=regbad",
            "To: <sip:alice@example.com>;tag=regsrv",
            "Call-ID: reg-bad@example.com",
            "CSeq: 1 REGISTER",
            "Contact: <sip:alice@192.0.2.40>;expires=3600",
        ],
    )
    return [
        lesson(
            L,
            id="privacy-pai",
            title="Privacy and asserted identity",
            minutes=12,
            tags=["privacy", "pai", "rfc3325"],
            summary="Privacy is RFC 3323. P-Asserted-Identity and P-Preferred-Identity are for trusted networks, not cryptographic identity.",
            objectives=[
                "Name the Privacy header and the id token",
                "Keep PAI and PPI inside a trust domain",
                "Refuse to treat PAI as a signature",
            ],
            illustration={
                "type": "states",
                "title": "Trust domain boundary",
                "caption": "PPI is a hint from the UA. PAI is inserted by a trusted element. Both stop at the edge.",
                "nodes": ["PPI", "Check", "PAI", "Strip"],
            },
            sections=[
                sec(
                    "Privacy asks for withholding",
                    "RFC 3323 defines the Privacy header and the tokens a user agent can set on it. The id token asks intermediaries to withhold a network-asserted identity, and other tokens cover headers, the session description, and user-level information.",
                    "Privacy: none means the user is not asking for those withholdings. If you do not understand a privacy token marked critical, you fail the request instead of forwarding an identity the user asked you to hide.",
                    "3323",
                ),
                sec(
                    "Asserted identity is not a signature",
                    "RFC 3325 defines P-Asserted-Identity and P-Preferred-Identity for trusted networks. A user agent may send P-Preferred-Identity as a hint, and a trusted proxy that has authenticated the user may replace that hint with P-Asserted-Identity.",
                    "Outside the trust domain, remove both P-Asserted-Identity and P-Preferred-Identity before the request is forwarded. P-Asserted-Identity is not cryptographic identity, and it does not prove the caller to a carrier or to a user the way a signed token does, which is why STIR is the later lesson for that job.",
                    "3325", "3323",
                ),
            ],
            flow=ladder(
                "PAI stops at the edge",
                ["Alice", "SBC", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "Alice sends P-Preferred-Identity. That is a hint to her trusted proxy, not a proof.", invite(ALICE, CUBE, extra=["P-Preferred-Identity: <sip:alice@example.com>", "Privacy: id"])),
                    (1, 0, "100", "res", "Trying does not assert an identity.", trying()),
                    (1, 2, "INVITE", "req", "This hop leaves the trust domain. Privacy: id means the asserted identity is withheld, so PAI is not forwarded.", invite(CUBE, CARRIER, branch="z9hG4bKpaiedge", extra=["Privacy: id"])),
                    (2, 1, "180", "res", "180 Ringing has no identity header to display as verified.", response(180, "Ringing", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"])),
                ],
            ),
            quiz=[
                quiz_item("RFC 3323 defines", ["The Privacy header", "SRTP", "telephone-event", "ICE"], 0, "The id token asks that a network-asserted identity be withheld.", "3323"),
                quiz_item("P-Asserted-Identity is", ["For trusted networks, and it is not cryptographic identity", "A PASSporT signature", "Proof for any downstream carrier", "An RTP header field"], 0, "RFC 3325 scopes it to a trust domain.", "3325"),
                quiz_item("P-Preferred-Identity is", ["A hint from the UA to its trusted proxy", "A certificate", "The answer SDP", "A 407 challenge"], 0, "The proxy asserts an identity only after it authenticates the user.", "3325"),
                quiz_item("At the edge of the trust domain you", ["Remove PAI and PPI", "Add PAI so the carrier can treat it as a signature", "Copy PAI into a=crypto", "Replace Privacy with a payload type"], 0, "Privacy: id specifically asks that the asserted identity be withheld.", "3323"),
                quiz_item("Privacy: id means", ["Withhold the network-asserted identity", "Publish the identity in RTP", "Disable TLS", "Set the call to sendonly"], 0, "It is a privacy request, not a verification result.", "3323"),
                quiz_item("A screen that says verified because PAI is present is", ["Wrong. PAI is not a cryptographic identity", "Required by RFC 3325 for every call", "The STIR success state", "Proof of digest"], 0, "Cryptographic caller identity is STIR, not PAI.", "3325"),
            ],
            cards=[
                card("RFC 3323", "Privacy header. id withholds a network-asserted identity.", "3323"),
                card("PPI", "P-Preferred-Identity. A hint from the UA inside the trust domain.", "3325"),
                card("PAI", "P-Asserted-Identity. Trusted networks only. Not a signature.", "3325"),
                card("Strip", "Remove PAI and PPI when the request leaves the trust domain.", "3325"),
            ],
            lab=make_lab(
                "See PAI on the wrong hop",
                "dissect",
                "This INVITE is addressed to the carrier and still contains P-Asserted-Identity and Privacy: id.",
                ["Press Dissect.", "Find Privacy and P-Asserted-Identity.", "Decide whether this hop is still inside a trust domain."],
                "What should happen to P-Asserted-Identity before this request reaches the carrier?",
                ["Remove it. Privacy id asks that the asserted identity be withheld", "Keep it, because PAI is a signature", "Move it into SDP c=", "Replace it with a payload type"],
                0,
                "RFC 3325 headers are for trusted networks. They are not cryptographic identity.",
                "3325",
                message=pai_msg,
            ),
            fault=make_fault(
                "Asserted identity forwarded anyway",
                "The carrier shows alice@example.com as a verified network identity. The SBC forwarded PAI on a request that also asked for Privacy id.",
                pai_msg,
                ["PAI left the trust domain even though Privacy id asked for it to be withheld", "PAI is a STIR signature so forwarding is required", "Privacy id means attach a fingerprint", "The From header is illegal"],
                0,
                "P-Asserted-Identity is a trusted-network header. It is not cryptographic identity, and Privacy id asks that it be withheld.",
                "The edge forwarded both the privacy request and the identity the request asked to withhold.",
                "Strip P-Asserted-Identity and P-Preferred-Identity at the trust boundary. Do not render PAI as a verified caller. Use STIR when you need a signed identity.",
                "3323", "3325",
            ),
        ),
        lesson(
            L,
            id="stir-shaken",
            title="STIR, PASSporT, and SHAKEN",
            minutes=14,
            tags=["stir", "passport", "shaken"],
            summary="STIR is RFC 8224, PASSporT is RFC 8225, certificates are RFC 8226, and the SHAKEN extension is RFC 8588. Attestation levels are ATIS.",
            objectives=[
                "Point at the four RFCs for STIR, PASSporT, certificates, and SHAKEN",
                "Require a verified Identity header before calling a call authenticated",
                "Attribute attestation levels to ATIS and confirm the current document",
            ],
            illustration={
                "type": "layers",
                "title": "What has to be present",
                "caption": "PAI is not a layer in this stack. Attestation levels are not invented here.",
                "layers": [
                    {"name": "RFC 8224", "detail": "STIR, Identity header in SIP"},
                    {"name": "RFC 8225", "detail": "PASSporT token"},
                    {"name": "RFC 8226", "detail": "Certificates used to sign and verify"},
                    {"name": "RFC 8588", "detail": "SHAKEN PASSporT extension"},
                ],
            },
            sections=[
                sec(
                    "The IETF pieces",
                    "STIR, RFC 8224, puts a signed identity in the SIP Identity header. The token format is PASSporT, RFC 8225, and the certificates used with that signature are RFC 8226.",
                    "RFC 8588 is the SHAKEN PASSporT extension, and it is how a SHAKEN profile rides on the IETF token. Verification that fails, or an Identity header that is absent, means you do not present the From value as STIR-authenticated.",
                    "8224", "8225", "8226", "8588",
                ),
                sec(
                    "Attestation levels are ATIS",
                    "Attestation levels people label A, B, and C are an ATIS SHAKEN concept. They are defined by ATIS SHAKEN specifications, and you confirm the current ATIS document before you teach or display those levels. This lesson does not invent an ATIS document number or a date.",
                    "The FCC call-authentication page is the public regulator summary to cite beside those specifications. P-Asserted-Identity does not fill in for a missing Identity header, and a failed signature stays failed.",
                    "fcc-stir", "8588", "3325",
                ),
            ],
            flow=ladder(
                "No Identity header, no STIR result",
                ["Alice", "SBC", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "This INVITE has no Identity header. It is not a STIR-authenticated request.", unsigned),
                    (1, 0, "100", "res", "Trying does not add a PASSporT.", trying()),
                    (1, 2, "INVITE", "req", "Forwarding the same request still does not create an Identity header. Do not mark the call verified.", invite(CUBE, CARRIER, branch="z9hG4bKstir02")),
                    (2, 1, "180", "res", "180 means ringing. It is not a certificate check and it is not an attestation level.", response(180, "Ringing", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"])),
                ],
            ),
            quiz=[
                quiz_item("STIR is", ["RFC 8224", "RFC 3325", "RFC 3711", "RFC 4733"], 0, "The Identity header is the SIP piece.", "8224"),
                quiz_item("PASSporT is", ["RFC 8225", "RFC 8224", "RFC 3323", "RFC 4568"], 0, "Certificates for this signature are RFC 8226.", "8225"),
                quiz_item("The SHAKEN PASSporT extension is", ["RFC 8588", "RFC 3261", "RFC 3550", "RFC 8489"], 0, "Use it with the STIR base documents, not instead of them.", "8588"),
                quiz_item("Attestation levels A, B, and C are", ["Defined by ATIS SHAKEN specifications. Confirm the current ATIS document", "Defined by a document number this lesson invents", "The same thing as PAI", "RTP payload types"], 0, "Cite the FCC call-authentication page as the regulator summary. Do not invent a date.", "fcc-stir"),
                quiz_item("An INVITE with no Identity header is", ["Not STIR-authenticated", "Fully attested because From is present", "Verified by 180 Ringing", "Covered by ptime"], 0, "Absence is not success. A failed signature is not success either.", "8224"),
                quiz_item("PAI can replace a missing STIR signature", ["No", "Yes", "Only when the codec is G.722", "Only on 407"], 0, "PAI is a trusted-network header, not cryptographic identity.", "3325"),
            ],
            cards=[
                card("RFC 8224", "STIR. Identity header in SIP.", "8224"),
                card("RFC 8225", "PASSporT.", "8225"),
                card("RFC 8226", "Certificates for STIR.", "8226"),
                card("Levels A/B/C", "ATIS SHAKEN. Confirm the current ATIS document. See also the FCC page.", "fcc-stir"),
            ],
            lab=make_lab(
                "No Identity header",
                "dissect",
                "Dissect the INVITE. Decide whether it is STIR-authenticated.",
                ["Press Dissect.", "Search for an Identity header.", "State the STIR result."],
                "Is this INVITE STIR-authenticated?",
                ["No. There is no Identity header to verify", "Yes, because the From user is Alice", "Yes, because the domain is example.com", "Yes, because Via is present"],
                0,
                "STIR verification needs the Identity header and the certificate check in RFC 8224 and RFC 8226.",
                "8224",
                message=unsigned,
            ),
            fault=make_fault(
                "PAI displayed as a verified caller",
                "A console labels the call verified. The INVITE has P-Asserted-Identity and no Identity header.",
                'INVITE sip:+15551212@192.0.2.40 SIP/2.0\n'
                "P-Asserted-Identity: <sip:alice@example.com>\n"
                "From: \"Alice\" <sip:alice@example.com>;tag=9fxced76sl\n"
                "(no Identity header)\n"
                "console: verified caller\n",
                ["PAI is not STIR. There is no Identity header to verify", "PAI is PASSporT", "180 Ringing would have been the signature", "Attestation levels are payload types 0, 8, and 9"],
                0,
                "STIR is RFC 8224. A missing Identity header is not a successful verification.",
                "The display treated a trusted-network header as a signed attestation.",
                "Show the call as not STIR-authenticated. Verify Identity with the RFC 8226 certificate when the header is present. For attestation levels, use the current ATIS SHAKEN specification and the FCC call-authentication page, and do not invent a document number or a date.",
                "8224", "8226", "fcc-stir", "3325",
            ),
        ),
        lesson(
            L,
            id="threats",
            title="Scanning, hijack, and toll fraud",
            minutes=13,
            tags=["abuse", "toll-fraud", "register"],
            summary="Scanning, registration hijack, and toll fraud are classes of abuse. The response is authentication, exposure control, and alerting.",
            objectives=[
                "Recognize unsolicited SIP as scanning pressure on an open listener",
                "Describe registration hijack as a replaced Contact binding",
                "Treat toll fraud as unauthorized call completion",
            ],
            illustration={
                "type": "table",
                "title": "Class of abuse and the defensive control",
                "caption": "Each row is a failure mode a defender looks for. None of these rows is a procedure.",
                "columns": ["Class", "What you observe", "Control"],
                "rows": [
                    ["Scanning", "INVITE and REGISTER from addresses you did not provision", "Do not expose SIP to the whole Internet"],
                    ["Registration hijack", "Contact for an address-of-record changes unexpectedly", "Authenticate REGISTER and alert on Contact changes"],
                    ["Toll fraud", "Calls complete from a source that is not allowed to place them", "Authorize outbound calls. See the CME guide and FCC call authentication"],
                ],
            },
            sections=[
                sec(
                    "Scanning and registration hijack",
                    "An Internet-reachable SIP port receives unsolicited INVITE and REGISTER requests. That traffic is scanning for open services, and the defensive response is to accept SIP only from peers you named and to require authentication on REGISTER.",
                    "Registration hijack is the failure in which a Contact binding for an address-of-record is replaced, so later calls are routed to a target the user did not request. RFC 3261 requires the registrar to authenticate REGISTER. Alert when Contact changes to an address you did not provision.",
                    "3261-22", "3261-10",
                ),
                sec(
                    "Toll fraud as a class",
                    "Toll fraud is a class of abuse in which an unauthorized party completes calls that someone else pays for, and you treat it as an authorization failure. The Cisco CME toll-fraud prevention guide documents controls such as trusting only known sources.",
                    "Call authentication, summarized on the FCC call-authentication page, reduces spoofed caller identity and does not replace outbound authorization. This lesson names the classes and the controls, and it does not give steps for causing the abuse.",
                    "cme-toll", "fcc-stir",
                ),
                sec(
                    "What you log",
                    "Log the source address, the method, the Request-URI, and whether a digest challenge was issued. A REGISTER that is stored with no challenge is a defect in the registrar configuration, and the fix is to refuse the binding.",
                    "Do not collect passwords into the ticket, and do not disable authentication to quiet an alarm. Pair this lesson with the hardening lesson for the allow list and the certificate check.",
                    "3261-22", "cme-toll",
                ),
            ],
            flow=ladder(
                "A REGISTER that should have been challenged",
                ["Unknown source", "Registrar"],
                [
                    (0, 1, "REGISTER", "req", "The source is 192.0.2.40. Alice's phone in this network is 203.0.113.10. This request is not from a provisioned phone.", sip(
                        "REGISTER sip:example.com SIP/2.0",
                        [
                            f"Via: SIP/2.0/UDP {CARRIER};branch=z9hG4bKregbad",
                            "Max-Forwards: 70",
                            "From: <sip:alice@example.com>;tag=regbad",
                            "To: <sip:alice@example.com>",
                            "Call-ID: reg-bad@example.com",
                            "CSeq: 1 REGISTER",
                            f"Contact: <sip:alice@{CARRIER}>",
                        ],
                    )),
                    (1, 0, "200", "res", "This 200 OK stored a binding with no digest challenge. That is the defect. The defensive result is a challenge, not a stored Contact.", register_ok_bad),
                    (0, 1, "INVITE", "req", "A later INVITE from an unnamed source is the same exposure class. It is not authorized because the source is not a provisioned peer.", invite(CARRIER, CUBE, branch="z9hG4bKscan01")),
                    (1, 0, "403", "res", "403 Forbidden is a reasonable policy response for a source you do not accept. It is not a codec negotiation.", response(403, "Forbidden", CUBE, to_tag="deny1", via_host=CARRIER, cseq="1 INVITE")),
                ],
            ),
            quiz=[
                quiz_item("Unsolicited INVITE and REGISTER from unnamed addresses are", ["Scanning pressure. Limit who can reach SIP", "Proof the codec list is wrong", "Required by RFC 3960", "A form of RTCP"], 0, "The control is exposure and authentication, not a payload-type change.", "3261-22"),
                quiz_item("Registration hijack, as a class, means", ["A Contact binding is replaced so calls go to an unintended target", "RTP sequence numbers wrap", "ptime is 20", "TLS port 5061 is closed"], 0, "Authenticate REGISTER and alert on unexpected Contact changes.", "3261-10"),
                quiz_item("Toll fraud, as a class, means", ["Unauthorized call completion that someone else pays for", "A G.722 clock of 8000", "A missing fmtp line", "An RTCP receiver report"], 0, "It is an authorization failure. See the CME toll-fraud guide.", "cme-toll"),
                quiz_item("The FCC call-authentication page is cited here because", ["Call authentication reduces spoofed caller identity and does not replace outbound authorization", "It assigns RTP payload types", "It replaces RFC 3261 section 22", "It is an ATIS document number"], 0, "Use it at a high level beside the CME controls.", "fcc-stir"),
                quiz_item("A REGISTER stored with no challenge is", ["A defect. Refuse the binding until digest succeeds", "The recommended default", "Required by SDP", "Proof of STIR"], 0, "RFC 3261 section 22 is how the registrar authenticates the user.", "3261-22"),
                quiz_item("This lesson includes attack steps", ["No. It names classes and defensive controls", "Yes, including password lists", "Yes, including scanner commands", "Yes, including forged signatures to replay"], 0, "Log source, method, and whether a challenge was sent. Keep passwords out of the ticket.", "cme-toll"),
            ],
            cards=[
                card("Scanning", "Unsolicited SIP from addresses you did not provision. Close the exposure.", "3261-22"),
                card("Hijack", "Unexpected Contact on an address-of-record. Authenticate REGISTER.", "3261-10"),
                card("Toll fraud", "Unauthorized calls that run up charges. Authorize the source.", "cme-toll"),
                card("FCC page", "Call authentication is not a substitute for outbound authorization.", "fcc-stir"),
            ],
            lab=make_lab(
                "Read an unchallenged REGISTER result",
                "dissect",
                "Dissect the 200 OK. The Contact is 192.0.2.40 and there was no digest challenge.",
                ["Press Dissect.", "Read Contact.", "State the control that was missing."],
                "What should have happened before this binding was stored?",
                ["A digest challenge, and a refusal if it fails", "An immediate 200 OK for every source", "A codec transcode", "A ptime change"],
                0,
                "Registration hijack is a replaced Contact. Authentication is the control.",
                "3261-22",
                message=register_ok_bad,
            ),
            fault=make_fault(
                "Outbound INVITE from a source that is not trusted",
                "Calls to +15551212 complete from 203.0.113.10, which is not on the trusted peer list, and usage charges appear.",
                "INVITE sip:+15551212@192.0.2.40 SIP/2.0\n"
                "Via: SIP/2.0/UDP 203.0.113.10;branch=z9hG4bKtoll01\n"
                "From: \"Alice\" <sip:alice@example.com>;tag=toll1\n"
                "To: <sip:+15551212@example.com>\n"
                "source 203.0.113.10 is not a trusted peer\n"
                "outbound class: not authorized\n",
                ["This is toll fraud as a class: the source is not authorized to complete calls", "The fix is to disable digest so the alarm stops", "The G.722 clock caused the charges", "PAI makes every source authorized"],
                0,
                "Authorize who may place calls. The CME toll-fraud guide is the product document for that control, and FCC call authentication addresses a different problem, spoofed caller identity.",
                "The edge accepted an INVITE from a source that was not on the trusted list and completed it.",
                "Reject sources you have not provisioned, require digest or TLS for peers you do accept, and keep outbound permissions separate from caller-ID authentication. Do not weaken authentication to clear the alarm.",
                "cme-toll", "fcc-stir", "3261-22",
            ),
        ),
        lesson(
            L,
            id="hardening",
            title="Hardening a SIP edge",
            minutes=12,
            tags=["hardening", "policy", "edge"],
            summary="A defensive edge limits peers, requires digest and TLS, strips PAI, and does not share SRTP keying across legs.",
            objectives=[
                "Write an allow list of signaling peers",
                "Require digest on REGISTER and a domain certificate on TLS",
                "Keep identity and media keying rules explicit",
            ],
            illustration={
                "type": "layers",
                "title": "Controls that stack",
                "caption": "Each control answers a different failure. Removing one does not make the others optional.",
                "layers": [
                    {"name": "Peers", "detail": "Only named addresses"},
                    {"name": "Digest", "detail": "401 and 407 headers stay distinct"},
                    {"name": "TLS", "detail": "RFC 5922 name check"},
                    {"name": "Identity", "detail": "Strip PAI. Verify STIR separately"},
                ],
            },
            sections=[
                sec(
                    "Who may speak SIP to you",
                    "Accept SIP from the peers you provisioned, such as 192.0.2.40 and 198.51.100.30 in this synthetic network, and refuse the rest. An open listener is the scanning condition from the threats lesson.",
                    "REGISTER is answered with 401 and WWW-Authenticate until Authorization checks out, and a proxy hop uses 407 and Proxy-Authorization. RFC 3261 section 22 and RFC 7616 are the references, and the password stays out of the configuration ticket.",
                    "3261-22", "7616", "cme-toll",
                ),
                sec(
                    "TLS, identity, and media",
                    "Trunks that use TLS present a certificate that identifies the SIP domain, checked under RFC 5922, and a name mismatch stays a failed check. Do not override that failure to force the trunk up.",
                    "Strip P-Asserted-Identity at the trust boundary, and treat a call as STIR-authenticated only after the Identity header verifies. On media, key each leg with SDES or with DTLS-SRTP as that leg negotiated, and do not assume the peers share a method. The CME toll-fraud guide remains the product reference for trusted sources.",
                    "5922", "3325", "8224", "3711",
                ),
            ],
            flow=ladder(
                "Policy on one INVITE",
                ["Alice", "SBC", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "Alice is a known source at 203.0.113.10. The request still needs whatever authentication the edge requires.", invite(ALICE, CUBE)),
                    (1, 0, "407", "res", "The proxy challenges. The client must answer with Proxy-Authorization, not with a copied password.", response(
                        407,
                        "Proxy Authentication Required",
                        CUBE,
                        extra=['Proxy-Authenticate: Digest realm="example.com", nonce="c0ffee09", algorithm=SHA-256, qop="auth"'],
                        to_tag="edge407",
                    )),
                    (0, 1, "INVITE", "req", "Retry from the known source. The digest response is a placeholder, not a computed credential.", invite(
                        ALICE,
                        CUBE,
                        extra=['Proxy-Authorization: Digest realm="example.com", username="alice", algorithm=SHA-256, uri="sip:+15551212@example.com", response="not-computed"'],
                        cseq=2,
                        branch="z9hG4bKedge02",
                    )),
                    (1, 2, "INVITE", "req", "Toward the carrier the edge uses TLS, strips PAI, and does not attach a fake verified label.", invite(CUBE, CARRIER, transport="TLS", branch="z9hG4bKedge03")),
                ],
            ),
            quiz=[
                quiz_item("An edge allow list should", ["Accept only provisioned peers", "Accept every source and sort it out in RTP", "Disable digest", "Publish PAI to the carrier"], 0, "Unnamed sources are the scanning case.", "cme-toll"),
                quiz_item("REGISTER authentication uses", ["401 and Authorization", "407 and a=crypto", "180 and SDP", "Port 0"], 0, "A proxy challenge is the 407 case, with Proxy-Authorization.", "3261-22"),
                quiz_item("A TLS trunk certificate is checked against", ["The SIP domain, per RFC 5922", "The first RTP SSRC", "The ptime value", "The fmtp range"], 0, "files.example.com does not stand in for example.com.", "5922"),
                quiz_item("PAI at the trust boundary is", ["Removed", "Converted into a PASSporT", "Copied into a=crypto", "Used as the digest password"], 0, "It is not cryptographic identity.", "3325"),
                quiz_item("SRTP keying on an SBC", ["Follows the method negotiated on each leg", "Uses one shared method for every peer", "Is implied by port 5061", "Is optional when PAI is present"], 0, "SDES and DTLS-SRTP are different. RFC 3711 is the media protection.", "3711"),
                quiz_item("Call authentication on the FCC page", ["Does not replace outbound authorization", "Assigns G.722 clocks", "Obsoletes RFC 3261", "Is an RTP profile"], 0, "Keep toll-fraud controls even when STIR is deployed.", "fcc-stir"),
            ],
            cards=[
                card("Allow list", "Named peers only. See the CME toll-fraud guide for trusted sources.", "cme-toll"),
                card("Digest", "401 uses Authorization. 407 uses Proxy-Authorization.", "3261-22"),
                card("RFC 5922", "Certificate name equals the SIP domain.", "5922"),
                card("Per-leg SRTP", "Do not copy keying from one peer to another.", "3711"),
            ],
            lab=make_lab(
                "Checklist, not a device stanza",
                "config",
                "Read the teaching checklist. It is not a vendor configuration and it is not a router QoS policy.",
                ["Read each numbered line.", "Name the RFC for the certificate line.", "Name the header that answers a 407."],
                "Which header answers a proxy challenge on this edge?",
                ["Proxy-Authorization", "Authorization", "P-Asserted-Identity", "Identity"],
                0,
                "407 uses Proxy-Authorization. 401 uses Authorization. Keep them split.",
                "3261-22",
                config=(
                    "; Teaching checklist. Not a vendor stanza and not a router QoS policy.\n"
                    "; 1. Accept SIP only from 192.0.2.40 and 198.51.100.30.\n"
                    "; 2. Require digest on REGISTER. 401 uses Authorization. 407 uses Proxy-Authorization.\n"
                    "; 3. Require TLS. The certificate must identify example.com (RFC 5922).\n"
                    "; 4. Strip P-Asserted-Identity at the trust boundary.\n"
                    "; 5. Key each SRTP leg with the method that leg negotiated.\n"
                    "; 6. Do not mark a call STIR-authenticated without a verified Identity header.\n"
                ),
            ),
            fault=make_fault(
                "Authentication removed to stop an alarm",
                "Operators cleared a scanning alarm by accepting every REGISTER. A new Contact appears for alice@example.com.",
                "policy change: digest disabled\n"
                "REGISTER sip:example.com SIP/2.0\n"
                "Contact: <sip:alice@192.0.2.40>\n"
                "stored: yes\n"
                "challenge: none\n",
                ["Restoring digest and the peer allow list is the fix", "Leaving digest off is required by RFC 5922", "The Contact is a valid STIR attestation", "ptime caused the new binding"],
                0,
                "REGISTER without a challenge is how an unexpected Contact gets stored. That is the hijack class.",
                "The edge traded a noisy alarm for unauthenticated bindings.",
                "Turn digest back on, keep the allow list, and alert on Contact changes. Use the CME toll-fraud guide for trusted-source controls and keep FCC call authentication as a separate caller-identity control.",
                "3261-22", "cme-toll", "fcc-stir",
            ),
        ),
    ]
def nat_track():
    L = "Advanced"
    private_sdp = (
        "v=0\n"
        "o=alice 2890844526 2890844526 IN IP4 10.1.2.3\n"
        "s=-\n"
        "c=IN IP4 10.1.2.3\n"
        "t=0 0\n"
        "m=audio 49170 RTP/AVP 0\n"
        "a=rtpmap:0 PCMU/8000\n"
        "a=sendrecv\n"
    )
    nat_log = sip(
        f"INVITE sip:+15551212@{CARRIER} SIP/2.0",
        [
            f"Via: SIP/2.0/UDP {ALICE};branch=z9hG4bKnatbad",
            "Max-Forwards: 70",
            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
            "To: <sip:+15551212@example.com>",
            "Call-ID: nat-break-1@example.com",
            "CSeq: 1 INVITE",
            f"Contact: <sip:alice@{ALICE}>",
            "Content-Type: application/sdp",
        ],
        private_sdp,
    )
    good_sdp = (
        "v=0\n"
        f"o=alice 1 1 IN IP4 {ALICE}\n"
        "s=-\n"
        f"c=IN IP4 {ALICE}\n"
        "t=0 0\n"
        "m=audio 49170 RTP/AVP 0\n"
        "a=rtpmap:0 PCMU/8000\n"
        "a=sendrecv\n"
    )
    alg_good = invite(ALICE, CARRIER, body=good_sdp)
    alg_bad = alg_good.replace("Content-Length:", "Content-Length: 9999\nX-Note: length left stale after rewrite\nX-Old-Length:", 1)
    rport_invite = sip(
        f"INVITE sip:+15551212@{CUBE} SIP/2.0",
        [
            f"Via: SIP/2.0/UDP {ALICE}:5060;branch=z9hG4bKrport1;rport",
            "Max-Forwards: 70",
            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
            "To: <sip:+15551212@example.com>",
            "Call-ID: rport-1@example.com",
            "CSeq: 1 INVITE",
            f"Contact: <sip:alice@{ALICE}:5060>",
            "Content-Type: application/sdp",
        ],
        good_sdp,
    )
    rport_trying = sip(
        "SIP/2.0 100 Trying",
        [
            f"Via: SIP/2.0/UDP {ALICE}:5060;branch=z9hG4bKrport1;received={ALICE};rport=49160",
            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
            "To: <sip:+15551212@example.com>",
            "Call-ID: rport-1@example.com",
            "CSeq: 1 INVITE",
        ],
    )
    lessons = [
        lesson(
            L,
            id="nat-breaks-sip",
            title="Embedded addresses and NAT",
            minutes=14,
            tags=["nat", "sdp", "contact"],
            summary="SIP and SDP embed IP addresses. NAT rewrites the packet header and leaves those embedded addresses behind.",
            objectives=[
                "Find addresses in Via, Contact, and SDP c=",
                "Explain why a packet-header NAT does not fix those fields",
                "Treat a private connection address as non-routable from the public peer",
            ],
            illustration={
                "type": "layers",
                "title": "Two places an address can sit",
                "caption": "NAT sees the outer header. SIP and SDP also name addresses in the payload.",
                "layers": [
                    {"name": "IP header", "detail": "What NAT rewrites"},
                    {"name": "Via and Contact", "detail": "Where responses and later requests go"},
                    {"name": "SDP c= and m=", "detail": "Where RTP is supposed to go"},
                ],
            },
            sections=[
                sec(
                    "The address is inside the message",
                    "SIP puts addresses in Via and Contact, and SDP puts an address in c= and a port in m=. Those fields are what the peer uses for the next signaling hop and for RTP.",
                    "A NAT changes the source address on the IP packet and does not understand the SIP body, so the embedded address can still name a host the public peer cannot reach. The call then rings, or even answers, while media has nowhere routable to go.",
                    "3261", "8866",
                ),
                sec(
                    "What a correct synthetic offer looks like",
                    "In this lab the offer uses the documentation address 203.0.113.10 in c=, which is a public documentation address from RFC 5737 and is the address the example intends the carrier to use. Contact uses that same documentation address so signaling and the description agree.",
                    "When c= instead carries a private address, that address is non-routable on the public Internet. The carrier at 192.0.2.40 cannot send RTP there. Fix the address the public peer will see, or use a mechanism from a later lesson, and do not expect the NAT to have edited c=.",
                    "8866", "5737", "3264",
                ),
            ],
            flow=ladder(
                "Offer with a documentation address",
                ["Alice", "NAT", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "Alice sends c= 203.0.113.10. That address is inside SDP, not only in the IP header.", invite(ALICE, CARRIER, body=good_sdp)),
                    (1, 2, "INVITE", "req", "NAT can change the packet source. It does not, by itself, rewrite c= or Contact.", invite(ALICE, CARRIER, body=good_sdp, branch="z9hG4bKnatfwd")),
                    (2, 1, "180", "res", "Ringing proves signaling arrived. It does not prove the c= address is a place RTP can go.", response(180, "Ringing", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"])),
                    (2, 1, "200", "res", "The answer names 192.0.2.40. RTP from the carrier is aimed at whatever c= said, which NAT may not have fixed.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_PTIME)),
                ],
            ),
            quiz=[
                quiz_item("NAT breaks SIP and SDP because", ["They embed addresses that a packet-header rewrite does not update", "RTP version 2 is illegal behind NAT", "ptime cannot be 20", "Digest forbids private networks"], 0, "Via, Contact, and c= are inside the message.", "3261"),
                quiz_item("c= tells the peer", ["Where to send media", "The digest realm", "The STIR attest level", "The RTCP fraction lost"], 0, "If that address is private, it is non-routable from the public peer.", "8866"),
                quiz_item("A 200 OK behind a broken c= line means", ["Signaling completed and media may still have nowhere routable to go", "RTP is guaranteed", "The NAT rewrote SDP", "Port 0 was used"], 0, "Read the connection line. Do not stop at the status code.", "3264"),
                quiz_item("Contact is used for", ["Later requests in the dialog", "The RTP timestamp", "The codec clock", "EF marking"], 0, "A private Contact has the same class of problem as a private c= line.", "3261"),
                quiz_item("Documentation address 203.0.113.10 is", ["A public documentation address from RFC 5737, used so labs are not a real network", "A private address", "An RTP payload type", "A nonce"], 0, "The fault in this lesson is a different, private connection address.", "5737"),
                quiz_item("A private address in c= is", ["Non-routable from the public carrier", "Rewritten automatically by every NAT", "The same as port 0", "Required by RFC 3550"], 0, "The carrier cannot send RTP to it.", "8866"),
            ],
            cards=[
                card("Embedded", "Via, Contact, and SDP c= carry addresses NAT does not rewrite.", "3261"),
                card("c=", "Media destination. A private value is non-routable on the public Internet.", "8866"),
                card("200 OK", "Signaling can succeed while RTP still cannot go where c= points.", "3264"),
                card("RFC 5737", "203.0.113.10 and the other lab addresses are documentation ranges.", "5737"),
            ],
            lab=make_lab(
                "Read a routable c= line",
                "dissect",
                "Dissect the offer. c= uses the documentation address 203.0.113.10. The fault beside this lab is the private-address case.",
                ["Press Dissect.", "Find c=.", "Compare it with Contact."],
                "This offer's c= address is",
                ["203.0.113.10, a documentation address the example intends the peer to use", "A private non-routable address", "0.0.0.0", "The RTP version"],
                0,
                "The broken case is a private c= line, which is non-routable from the public peer. This message is the healthy pattern.",
                "8866",
                message=invite(ALICE, CARRIER, body=good_sdp),
            ),
            fault=make_fault(
                "Private address left in c=",
                "The carrier never sends RTP. The SDP connection line uses a private address, and that address is non-routable.",
                nat_log,
                ["c= names a private address the carrier cannot route", "The Via branch is missing the magic cookie", "PCMU is illegal behind NAT", "180 Ringing rewrites SDP"],
                0,
                "The address in c= is private and non-routable from 192.0.2.40. NAT rewrote the packet header, not the SDP body.",
                "SIP and SDP embedded a private address. The public peer was told to send media there.",
                "Signal a public address the carrier can route, or use the NAT traversal tools in the following lessons. Do not assume the NAT edited c=.",
                "8866", "3261", "3264",
            ),
        ),
        lesson(
            L,
            id="rport",
            title="rport and symmetric responses",
            minutes=12,
            tags=["rport", "rfc3581", "via"],
            summary="RFC 3581 adds rport so the response is sent to the source address and port the request came from.",
            objectives=[
                "Add rport on Via when you need symmetric response routing",
                "Read received and rport on the response Via",
                "Keep rport separate from RTP NAT traversal",
            ],
            illustration={
                "type": "states",
                "title": "Where the response goes",
                "caption": "The server answers the source it observed. rport does not rewrite SDP.",
                "nodes": ["Via rport", "Source port", "received", "Response"],
            },
            sections=[
                sec(
                    "Symmetric response routing",
                    "RFC 3581 defines the rport Via parameter for symmetric response routing. The client puts rport on Via, and the server sends the response to the source IP address and source port of the request instead of trusting only the host and port written in Via.",
                    "The server adds received with the source address it saw and fills rport with the source port it saw. In this lab the Via host is 203.0.113.10 port 5060 and the observed source port is 49160, so the response is aimed at port 49160.",
                    "3581", "3261",
                ),
                sec(
                    "Signaling only",
                    "rport fixes the return path for SIP responses. It does not change c=, and it does not move RTP. A call can complete signaling through rport and still have one-way or no audio because the media address is a separate field.",
                    "Use rport together with a media solution from the later lessons when the RTP address is also wrong. Do not treat a filled-in rport parameter as evidence that SDP was rewritten.",
                    "3581", "8866",
                ),
            ],
            flow=ladder(
                "Response follows the source port",
                ["Alice", "SBC"],
                [
                    (0, 1, "INVITE", "req", "Via includes rport with no value yet. The UDP source port on the wire is 49160, not 5060.", rport_invite),
                    (1, 0, "100", "res", "The response Via has received=203.0.113.10 and rport=49160. Send it to that source, not blindly to port 5060.", rport_trying),
                    (1, 0, "180", "res", "180 uses the same Via parameters so it takes the same symmetric path.", sip(
                        "SIP/2.0 180 Ringing",
                        [
                            f"Via: SIP/2.0/UDP {ALICE}:5060;branch=z9hG4bKrport1;received={ALICE};rport=49160",
                            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
                            "To: <sip:+15551212@example.com>;tag=314159",
                            "Call-ID: rport-1@example.com",
                            "CSeq: 1 INVITE",
                            f"Contact: <sip:bob@{CUBE}>",
                        ],
                    )),
                    (1, 0, "200", "res", "200 OK also follows rport. The SDP in the body is still a separate media decision.", sip(
                        "SIP/2.0 200 OK",
                        [
                            f"Via: SIP/2.0/UDP {ALICE}:5060;branch=z9hG4bKrport1;received={ALICE};rport=49160",
                            'From: "Alice" <sip:alice@example.com>;tag=9fxced76sl',
                            "To: <sip:+15551212@example.com>;tag=314159",
                            "Call-ID: rport-1@example.com",
                            "CSeq: 1 INVITE",
                            f"Contact: <sip:bob@{CUBE}>",
                            "Content-Type: application/sdp",
                        ],
                        ANSWER_PTIME,
                    )),
                ],
            ),
            quiz=[
                quiz_item("rport is defined by", ["RFC 3581", "RFC 8445", "RFC 3711", "RFC 4733"], 0, "It is symmetric response routing for SIP.", "3581"),
                quiz_item("The server sends the response to", ["The source address and port of the request", "Only the port written in Via, always", "The c= address", "Port 0"], 0, "received and rport record what the server actually saw.", "3581"),
                quiz_item("rport fixes", ["The SIP response path", "The RTP destination in c=", "The codec clock", "STIR attestation"], 0, "Media addresses are untouched by this parameter.", "3581"),
                quiz_item("In the lab, rport=49160 means", ["The request's source port was 49160", "The RTP port must be 49160", "The stream is rejected", "ptime is 49160"], 0, "Via said 5060. The packet arrived from 49160.", "3581"),
                quiz_item("received= is", ["The source address the server observed", "The SDP origin username", "A digest username", "An ICE type"], 0, "It is written on the response Via.", "3581"),
                quiz_item("A successful rport exchange still requires you to", ["Read c= before you trust the media path", "Skip SDP", "Set G.722 to clock 16000", "Remove Contact"], 0, "Signaling symmetry is not media symmetry.", "8866"),
            ],
            cards=[
                card("RFC 3581", "rport. Symmetric SIP response routing.", "3581"),
                card("received", "Source address the server saw.", "3581"),
                card("rport value", "Source port the server saw.", "3581"),
                card("Not SDP", "rport does not rewrite c=.", "3581"),
            ],
            lab=make_lab(
                "Read rport on the response",
                "dissect",
                "Dissect the 100 Trying. Via has received and rport filled in.",
                ["Press Dissect.", "Find rport.", "State which port receives the response."],
                "The response is sent to UDP port",
                ["49160", "5060 only, ignoring rport", "0", "5061"],
                0,
                "RFC 3581 tells the server to use the source port it observed.",
                "3581",
                message=rport_trying,
            ),
            fault=make_fault(
                "Response sent to Via port 5060",
                "The client set rport. The server still sends responses to 203.0.113.10:5060 and they never arrive. The request source port was 49160.",
                "request Via: SIP/2.0/UDP 203.0.113.10:5060;branch=z9hG4bKrport1;rport\n"
                "observed source: 203.0.113.10:49160\n"
                "response sent to 203.0.113.10:5060\n"
                "received and rport not written\n",
                ["The server ignored rport and did not answer the source port", "rport rewrites c=", "49160 means the m-line is rejected", "5060 is the RTP clock"],
                0,
                "RFC 3581 sends the response to the observed source and records received and rport.",
                "The server answered the port written in Via and dropped the symmetric-routing parameter.",
                "Send the response to 203.0.113.10 port 49160 and add received and rport on Via. Then check c= separately, because this fix is signaling only.",
                "3581",
            ),
        ),
        lesson(
            L,
            id="stun",
            title="STUN server-reflexive addresses",
            minutes=13,
            tags=["stun", "rfc8489", "srflx"],
            summary="STUN, RFC 8489, lets a client learn the address a server sees. It obsoletes RFC 5389.",
            objectives=[
                "State that RFC 8489 obsoletes RFC 5389 and where status is decided",
                "Describe a Binding request as a way to learn a server-reflexive address",
                "Keep STUN separate from a SIP registrar",
            ],
            illustration={
                "type": "states",
                "title": "Learn the address the server sees",
                "caption": "The reflexive address is what STUN observed. It is not a SIP Contact by itself.",
                "nodes": ["Binding", "NAT", "Mapped", "srflx"],
            },
            sections=[
                sec(
                    "The current STUN specification",
                    "STUN is RFC 8489, which obsoletes RFC 5389. The RFC Editor status banner is the authority for that status. A Binding request asks a STUN server to tell the client the source address and port the server observed.",
                    "That observed address is the server-reflexive address, and the response attribute used for it is XOR-MAPPED-ADDRESS. STUN is not SIP, and a STUN server is not a SIP registrar.",
                    "8489",
                ),
                sec(
                    "What you do with the result",
                    "ICE, in a later lesson, uses this address as a candidate of type srflx. STUN by itself does not rewrite a SIP INVITE and does not allocate a relay.",
                    "If both peers are behind NATs that refuse unsolicited inbound UDP, a reflexive address may still be unreachable. That limit is why TURN exists, and it is not a reason to put a private address in c= and hope.",
                    "8489", "8445",
                ),
            ],
            flow=ladder(
                "Binding request, then a SIP offer",
                ["Client", "STUN", "Carrier"],
                [
                    (0, 1, "Binding", "req", "STUN Binding request from 203.0.113.10. This is not a SIP method.", "STUN Binding request\nclient 203.0.113.10\nserver stun.example.com\n"),
                    (1, 0, "Mapped", "res", "The server reports the address it saw. RFC 8489 carries that in XOR-MAPPED-ADDRESS.", f"STUN Binding success\nXOR-MAPPED-ADDRESS {CUBE}:49170\n"),
                    (0, 2, "INVITE", "req", "Only now does SIP start. A later ICE offer can list the mapped address as srflx. This plain INVITE still uses a documentation c= line.", invite(ALICE, CARRIER, body=good_sdp, branch="z9hG4bKstun01")),
                    (2, 0, "200", "res", "The SIP answer does not mean STUN ran. Read the trace for an actual Binding transaction.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_PTIME)),
                ],
            ),
            quiz=[
                quiz_item("The current STUN specification is", ["RFC 8489, which obsoletes RFC 5389", "RFC 5389 only, with no successor", "RFC 3261", "RFC 4733"], 0, "The RFC Editor status banner is the authority for that status.", "8489"),
                quiz_item("A Binding request learns", ["The server-reflexive address the STUN server observed", "A SIP Contact binding", "An SRTP key", "A digest nonce"], 0, "XOR-MAPPED-ADDRESS carries that result.", "8489"),
                quiz_item("STUN is", ["Not a SIP method and not a registrar", "A replacement for REGISTER", "An SDP direction", "A payload type"], 0, "Do not confuse a Binding success with a SIP 200 OK.", "8489"),
                quiz_item("srflx means", ["Server reflexive, the address STUN observed", "A relay allocated by TURN", "A private interface", "Port 0"], 0, "ICE is what promotes that address into a candidate.", "8445"),
                quiz_item("STUN alone may fail when", ["Both sides are behind NATs that drop unsolicited inbound UDP", "The RTP version is 2", "ptime is 20", "The From tag is present"], 0, "A reflexive address is not a relay.", "8489"),
                quiz_item("The status of RFC 5389 is decided by", ["The RFC Editor status banner", "A vendor release note alone", "The SDP session version", "The marker bit"], 0, "RFC 8489 obsoletes RFC 5389. The banner is the authority.", "8489"),
            ],
            cards=[
                card("RFC 8489", "Current STUN. Obsoletes RFC 5389. Trust the status banner.", "8489"),
                card("Binding", "Request that asks what address the server sees.", "8489"),
                card("XOR-MAPPED-ADDRESS", "The reflexive address in the success response.", "8489"),
                card("Not SIP", "A STUN server does not store a SIP Contact.", "8489"),
            ],
            lab=make_lab(
                "Separate STUN text from SIP",
                "capture",
                "The capture has a STUN note and a SIP 200 OK. Only one of them is a Binding result.",
                ["Press Extract SIP.", "Confirm the SIP message is the 200 OK.", "Read the STUN lines that the extractor will not treat as SIP."],
                "Which document defines the Binding transaction?",
                ["RFC 8489", "RFC 3264", "RFC 3325", "RFC 6086"],
                0,
                "RFC 8489 obsoletes RFC 5389. The RFC Editor status banner is the authority for that status.",
                "8489",
                message=(
                    "Sent:\n"
                    "STUN Binding request\n"
                    "client 203.0.113.10\n"
                    "\n"
                    "Received:\n"
                    + response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_PTIME)
                ),
            ),
            fault=make_fault(
                "STUN success treated as a SIP registration",
                "A Binding success is logged and the phone is marked registered. No SIP REGISTER occurred.",
                "STUN Binding success\n"
                f"XOR-MAPPED-ADDRESS {CUBE}:49170\n"
                "registrar bindings: none\n"
                "console: registered\n",
                ["STUN learned a reflexive address. It did not create a SIP Contact binding", "XOR-MAPPED-ADDRESS is a Contact header", "RFC 8489 replaces RFC 3261", "The mapped port rejects the stream"],
                0,
                "RFC 8489 is STUN. SIP registration is still REGISTER, authenticated under RFC 3261.",
                "The operations screen collapsed two protocols into one status.",
                "Show the reflexive address as a STUN result. Require a SIP REGISTER and a digest or TLS check before you show the user as registered.",
                "8489", "3261-10",
            ),
        ),
        lesson(
            L,
            id="turn",
            title="TURN relays",
            minutes=12,
            tags=["turn", "rfc8656", "relay"],
            summary="TURN, RFC 8656, allocates a relay when host and server-reflexive paths fail. It obsoletes RFC 5766.",
            objectives=[
                "State that RFC 8656 obsoletes RFC 5766 and where status is decided",
                "Describe Allocate as the way a client gets a relayed address",
                "Use the relay only as a media path, not as a SIP registrar",
            ],
            illustration={
                "type": "states",
                "title": "A relay when direct paths fail",
                "caption": "The relay address is allocated. It is candidate type relay in ICE.",
                "nodes": ["Allocate", "Relay", "Permission", "Media"],
            },
            sections=[
                sec(
                    "The current TURN specification",
                    "TURN is RFC 8656, which obsoletes RFC 5766. The RFC Editor status banner is the authority for that status. The client sends Allocate, and the server reserves a relayed transport address that both sides can send media through.",
                    "Permissions control who may send to that relay. TURN is a media relay, not a SIP proxy and not a rewrite of Via. The relay address in this synthetic network is 198.51.100.30.",
                    "8656",
                ),
                sec(
                    "When the relay is the path",
                    "Use TURN when host and server-reflexive candidates cannot carry the media. The remote peer sends RTP to the relayed address, and the TURN server forwards it to the client.",
                    "ICE is the negotiation that chooses the relay instead of guessing. Putting the relay address into c= by hand, with no Allocate and no candidate line, is not a TURN session.",
                    "8656", "8445",
                ),
            ],
            flow=ladder(
                "Allocate, then media via the relay",
                ["Client", "TURN", "Peer"],
                [
                    (0, 1, "Allocate", "req", "TURN Allocate. RFC 8656. This is not a SIP INVITE.", f"TURN Allocate request\nclient {ALICE}\nserver turn.example.com\n"),
                    (1, 0, "Relay", "res", "The allocated relay address is 198.51.100.30 port 50000.", f"TURN Allocate success\nRELAYED-ADDRESS {CUCM}:50000\n"),
                    (2, 1, "RTP", "req", "The peer sends media to the relay, not to a private address inside SDP.", f"RTP v=2\nssrc=0xA1A2A3A4\nsource {CARRIER}:40050\ndestination {CUCM}:50000\n"),
                    (1, 0, "RTP", "req", "TURN forwards that media to the client. SIP signaling is a separate path and is not rewritten by Allocate.", f"RTP forwarded\ndestination {ALICE}:49170\nrelay {CUCM}:50000\n"),
                ],
            ),
            quiz=[
                quiz_item("The current TURN specification is", ["RFC 8656, which obsoletes RFC 5766", "RFC 5766 with no successor", "RFC 8489", "RFC 3581"], 0, "The RFC Editor status banner is the authority for that status.", "8656"),
                quiz_item("Allocate provides", ["A relayed transport address", "A SIP Contact binding", "A digest nonce", "An a=crypto key"], 0, "Peers send media to that relay.", "8656"),
                quiz_item("TURN is", ["A media relay", "A SIP header rewrite", "A replacement for 180 Ringing", "The G.722 clock"], 0, "It does not parse SDP and it is not a registrar.", "8656"),
                quiz_item("The relay is used when", ["Host and server-reflexive paths are not enough", "Every call starts", "The INVITE has no Via", "ptime is omitted"], 0, "ICE is how that choice is made instead of a hand-edited c= line.", "8445"),
                quiz_item("In this lesson the relay address is", ["198.51.100.30", "A private non-routable address", "Port 0", "The nonce c0ffee01"], 0, "It is a documentation address playing the role of the allocated relay.", "8656"),
                quiz_item("RFC 5766's status is decided by", ["The RFC Editor status banner", "The SDP o= line", "A marker bit", "Privacy: id"], 0, "RFC 8656 obsoletes RFC 5766.", "8656"),
            ],
            cards=[
                card("RFC 8656", "Current TURN. Obsoletes RFC 5766. Trust the status banner.", "8656"),
                card("Allocate", "Reserves a relayed transport address.", "8656"),
                card("Relay", "Peers send media to the relay. TURN forwards it.", "8656"),
                card("Not SIP", "Allocate is not REGISTER and not an SDP rewrite.", "8656"),
            ],
            lab=make_lab(
                "Read an Allocate result",
                "capture",
                "The text is a TURN result, not a SIP request. Identify the relayed address.",
                ["Open the capture text.", "Find RELAYED-ADDRESS.", "Name the RFC that defines Allocate."],
                "The relayed address in this result is",
                ["198.51.100.30 port 50000", "Port 0 on an m-line", "A SIP Contact at example.com", "Payload type 9"],
                0,
                "RFC 8656 obsoletes RFC 5766. The RFC Editor status banner is the authority for that status.",
                "8656",
                message=f"Received:\nTURN Allocate success\nRELAYED-ADDRESS {CUCM}:50000\n",
            ),
            fault=make_fault(
                "Relay address pasted into c= with no Allocate",
                "SDP says c=198.51.100.30 but no TURN Allocate succeeded. RTP to that address is dropped.",
                f"c=IN IP4 {CUCM}\nm=audio 50000 RTP/AVP 0\nTURN allocations: none\n",
                ["A relay address is valid only after Allocate. This SDP invented one", "c= creates a TURN allocation", "Port 50000 means rejection", "RFC 8656 is a SIP method"],
                0,
                "TURN relays exist because the server allocated them. RFC 8656 obsoletes RFC 5766, and the status banner is the authority.",
                "Someone copied a documentation address into c= and called it a relay.",
                "Run Allocate, use the returned relay, and let ICE offer it as a relay candidate. Do not type a relay address into SDP by hand.",
                "8656", "8445",
            ),
        ),
    ]
    lessons.extend(_nat_rest(L, alg_good, alg_bad, good_sdp))
    return {
        "id": "nat",
        "title": "NAT, ICE, and the ALG problem",
        "summary": "Why embedded addresses break, and what rport, STUN, TURN, ICE, SIP ALGs, and media latching each actually do.",
        "level": L,
        "order": 8,
        "lessons": lessons,
    }
def _nat_rest(L, alg_good, alg_bad, good_sdp):
    tls_invite = invite(ALICE, CARRIER, transport="TLS", body=good_sdp, branch="z9hG4bKalgTls")
    latch_offer = good_sdp
    return [
        lesson(
            L,
            id="ice",
            title="ICE candidate types",
            minutes=15,
            tags=["ice", "rfc8445", "candidates"],
            summary="ICE is RFC 8445, which obsoletes RFC 5245. Candidates are host, srflx, prflx, and relay.",
            objectives=[
                "Name the four candidate types",
                "State that RFC 8445 obsoletes RFC 5245 and where status is decided",
                "Let connectivity checks choose the pair",
            ],
            illustration={
                "type": "table",
                "title": "Four candidate types",
                "caption": "prflx is discovered during checks. It is not usually in the first offer.",
                "columns": ["Type", "Where it comes from"],
                "rows": [
                    ["host", "A local interface address"],
                    ["srflx", "The address a STUN server observed"],
                    ["prflx", "An address learned from a connectivity check"],
                    ["relay", "A TURN relayed address"],
                ],
            },
            sections=[
                sec(
                    "The current ICE specification",
                    "ICE is RFC 8445, which obsoletes RFC 5245. The RFC Editor status banner is the authority for that status. Each side gathers candidates and puts them in SDP, then both sides run connectivity checks and nominate a pair that actually passes packets.",
                    "The candidate types are host, srflx, prflx, and relay, and each one names a different place the media address came from. A host candidate is a local interface, srflx is the server-reflexive address from STUN in RFC 8489, and relay is the TURN address from RFC 8656. A prflx, or peer-reflexive, candidate appears when a check arrives from an address that was not already in the list.",
                    "8445", "8489", "8656",
                ),
                sec(
                    "Checks, not the order of the lines",
                    "A higher-priority candidate is not used until a check succeeds. ICE can nominate a relay even when a host candidate is listed first, if the host candidate cannot receive packets from the peer.",
                    "c= remains in the SDP for agents that do not do ICE, and ICE agents still follow the check result for media. Do not delete the candidate lines and keep only c= when you meant to run ICE.",
                    "8445", "8866",
                ),
                sec(
                    "What the answer must still do",
                    "ICE rides inside offer/answer, so the answer still has the same number of m-lines in the same order, and a rejected stream is still port 0. Candidate lines add addresses for checks, and they do not replace that m-line rule.",
                    "An SBC that strips a=candidate and leaves a private c= line has removed the traversal information and kept the address that does not route. Pass the candidates or terminate ICE on the SBC on purpose.",
                    "8445", "3264",
                ),
            ],
            flow=ladder(
                "Gather, offer, check, nominate",
                ["Alice", "STUN/TURN", "Carrier"],
                [
                    (0, 1, "Gather", "req", "STUN and TURN produce srflx and relay. host is local. prflx is not gathered here.", f"gather host {ALICE}:49170\ngather srflx {CUBE}:49170\ngather relay {CUCM}:50000\n"),
                    (0, 2, "INVITE", "req", "The offer lists host, srflx, and relay as a=candidate lines. RFC 8445.", invite(ALICE, CARRIER, body=ICE_OFFER)),
                    (2, 0, "200", "res", "The answer has one m-line, matching the offer, plus the carrier's host candidate.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ICE_ANSWER)),
                    (0, 2, "Check", "req", "A STUN connectivity check runs on the candidate pair. Nomination follows a pair that succeeds, which may be the relay.", f"STUN connectivity check\npair {ALICE}:49170 -> {CARRIER}:40050\npeer-reflexive candidates appear only if a new source is seen\n"),
                ],
            ),
            quiz=[
                quiz_item("ICE is", ["RFC 8445, which obsoletes RFC 5245", "RFC 5245 with no successor", "RFC 3581", "RFC 3323"], 0, "The RFC Editor status banner is the authority for that status.", "8445"),
                quiz_item("The four candidate types are", ["host, srflx, prflx, and relay", "sendrecv, sendonly, recvonly, and inactive", "401, 407, 180, and 183", "0, 8, 9, and 18"], 0, "Direction attributes and payload types are different lists.", "8445"),
                quiz_item("srflx comes from", ["STUN, RFC 8489", "A local interface only", "SDES", "A SIP registrar"], 0, "It is the server-reflexive address.", "8489"),
                quiz_item("relay comes from", ["TURN, RFC 8656", "The Via branch", "ptime", "Privacy: id"], 0, "Allocate returns the relayed address.", "8656"),
                quiz_item("prflx is", ["Learned from a connectivity check, not typically gathered up front", "The SIP Contact", "Always port 0", "The G.722 clock"], 0, "Peer reflexive means the check revealed a new address.", "8445"),
                quiz_item("ICE does not cancel the rule that", ["The answer keeps the same m-line count and order", "c= must be 0.0.0.0", "RTP version becomes 1", "rport rewrites candidates"], 0, "Port 0 is still how a stream is rejected.", "3264"),
            ],
            cards=[
                card("RFC 8445", "Current ICE. Obsoletes RFC 5245. Trust the status banner.", "8445"),
                card("host", "Local interface.", "8445"),
                card("srflx / relay", "STUN reflexive address, and TURN relay.", "8489"),
                card("prflx", "Discovered during a connectivity check.", "8445"),
            ],
            lab=make_lab(
                "Read the candidate types",
                "sdp",
                "Negotiate the offer. Then read the a=candidate lines yourself. The negotiator matches codecs. You match the types.",
                ["Press Negotiate.", "Find typ host, typ srflx, and typ relay.", "Confirm the answer still has one m-line."],
                "Which type is missing from the initial offer on purpose?",
                ["prflx, because it is learned from a check", "host", "srflx", "relay"],
                0,
                "Peer-reflexive candidates show up when a check comes from an address you had not listed.",
                "8445",
                offer=ICE_OFFER,
                answer=ICE_ANSWER,
            ),
            fault=make_fault(
                "Candidates stripped, private path left behind",
                "The offer had host, srflx, and relay candidates. The forwarded offer has only c= and no a=candidate lines, and media fails.",
                f"forwarded c=IN IP4 {ALICE}\nforwarded m=audio 49170 RTP/AVP 0\na=candidate lines: removed\nchecks: none\n",
                ["ICE candidates were removed, so no connectivity check can run", "RFC 8445 says to delete candidates", "prflx means port 0", "STUN is a SIP 407"],
                0,
                "RFC 8445 selects a working pair by checks. Without candidates there is nothing to check.",
                "An intermediary stripped a=candidate and left a single connection line.",
                "Pass the candidate lines, or terminate ICE on the SBC and insert a routable address on purpose. Keep the m-line count aligned with RFC 3264.",
                "8445", "3264",
            ),
        ),
        lesson(
            L,
            id="sip-alg",
            title="The SIP ALG problem",
            minutes=13,
            tags=["alg", "tls", "sdp"],
            summary="A SIP ALG rewrites SIP and SDP in transit and often corrupts the call. It cannot rewrite TLS.",
            objectives=[
                "Recognize an in-path rewrite of Via, Contact, or c=",
                "Treat a broken Content-Length after a rewrite as corruption",
                "Prefer TLS when you need the ALG to be unable to edit the body",
            ],
            illustration={
                "type": "states",
                "title": "UDP is visible, TLS is not",
                "caption": "The ALG is not an SBC you configured. It is an unexpected editor on the path.",
                "nodes": ["UDP INVITE", "Rewrite", "Stale length", "TLS passes"],
            },
            sections=[
                sec(
                    "An editor you did not configure",
                    "A SIP ALG rewrites addresses inside SIP and SDP as the message crosses a NAT. The intent is to fix the embedded-address problem, and the usual result is a corrupted call, because the rewrite is partial or it leaves Content-Length stale.",
                    "Look for a Via or c= line that changed between two captures of the same request, and for a Content-Length that does not match the body, because those are the symptoms of an ALG edit. The fix is to disable the ALG on the access device.",
                    "3261", "8866",
                ),
                sec(
                    "TLS is opaque to the ALG",
                    "The ALG cannot rewrite TLS, because the SIP headers and the SDP are inside the protected connection. A trunk that uses TLS, with a certificate checked under RFC 5922, does not get its c= line edited in flight.",
                    "Disabling the ALG and using TLS are the two practical responses. Do not add a second uncoordinated rewrite on an SBC to chase the damage, or you will have two editors and no original message.",
                    "3261-18", "5922",
                ),
            ],
            flow=ladder(
                "UDP rewritten, TLS not rewritten",
                ["Phone", "ALG", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "A correct UDP offer leaves the phone. c= is 203.0.113.10 and Content-Length matches.", alg_good),
                    (1, 2, "INVITE", "req", "The ALG edited the message and left Content-Length stale. This is corruption, not a successful NAT fix.", alg_bad),
                    (2, 1, "400", "res", "The carrier rejects the damaged request. The status is a symptom of the rewrite, not a codec failure.", response(400, "Bad Request", CARRIER, to_tag="alg400", via_host=ALICE)),
                    (0, 2, "INVITE", "req", "The same offer over TLS reaches the carrier without an ALG edit. The ALG cannot see the body.", tls_invite),
                ],
            ),
            quiz=[
                quiz_item("A SIP ALG", ["Rewrites SIP and SDP in transit and often corrupts the call", "Is required by RFC 3264", "Allocates a TURN relay", "Verifies PASSporT"], 0, "Partial edits and stale Content-Length values are the usual damage.", "8866"),
                quiz_item("The ALG and TLS", ["The ALG cannot rewrite TLS", "TLS exists so the ALG can edit SDP", "TLS removes the need for a certificate", "TLS sets port 0"], 0, "The body is protected. RFC 5922 still governs the certificate.", "3261-18"),
                quiz_item("A stale Content-Length after a path rewrite means", ["The message was corrupted in transit", "RFC 8866 asked for a longer body", "ptime expanded the body", "rport requires length 9999"], 0, "Compare the length with the bytes you actually captured.", "3261"),
                quiz_item("The defensive actions are", ["Disable the ALG, and use TLS for trunks that must cross it", "Add a third rewriter", "Put a private address in c=", "Turn off Content-Length"], 0, "Two editors are worse than one. TLS is opaque to the ALG.", "5922"),
                quiz_item("An ALG is not", ["An SBC policy you wrote and can read", "Capable of damaging UDP SIP", "A reason to compare two captures", "Something that touches cleartext SDP"], 0, "If you did not configure it, treat the rewrite as a fault.", "3261"),
                quiz_item("400 Bad Request in this ladder is", ["A reasonable result of a body whose length no longer matches", "Proof that PCMU is illegal", "An early-media 183", "A STUN Binding"], 0, "Fix the path edit. Do not start with the codec.", "3261"),
            ],
            cards=[
                card("ALG", "In-path SIP and SDP rewrite. Often corrupts the call.", "8866"),
                card("Length", "If Content-Length does not match the body, the edit is corrupt.", "3261"),
                card("TLS", "The ALG cannot rewrite what it cannot see.", "3261-18"),
                card("Disable it", "Turn the ALG off. Do not stack a second hidden editor.", "3261"),
            ],
            lab=make_lab(
                "See a stale length",
                "dissect",
                "Dissect the forwarded INVITE. Content-Length does not match the body.",
                ["Press Dissect.", "Read the Content-Length warning.", "Find the note that the length was left stale."],
                "What does a stale Content-Length after an address rewrite indicate?",
                ["The message was corrupted in transit", "RFC 3581 filled rport", "The offer is a legal port-0 rejection", "STIR verified the body"],
                0,
                "Disable the ALG. Use TLS when the trunk must cross a device that would otherwise edit SIP.",
                "3261",
                message=alg_bad,
            ),
            fault=make_fault(
                "ALG rewrote c= and left the length",
                "UDP calls fail with 400. TLS calls to the same carrier succeed. The UDP body length does not match.",
                "capture A UDP Content-Length: 9999\n"
                "capture A body is shorter than 9999\n"
                f"capture A c=IN IP4 {CUBE}\n"
                "capture B TLS Via: SIP/2.0/TLS 203.0.113.10\n"
                "capture B body unchanged\n",
                ["The ALG edited cleartext SIP and could not edit TLS", "TLS caused the 400", "9999 is a legal ptime", "The certificate must be removed"],
                0,
                "A SIP ALG rewrites SIP and SDP in transit and often corrupts calls. It cannot rewrite TLS.",
                "The access device edited the UDP INVITE, changed an address, and did not store a matching Content-Length.",
                "Disable the SIP ALG. Keep the TLS trunk, and check the certificate under RFC 5922. Compare a capture from the phone with a capture from the carrier before you change codecs.",
                "3261", "3261-18", "5922",
            ),
        ),
        lesson(
            L,
            id="media-latching",
            title="Media latching on an SBC",
            minutes=14,
            tags=["latching", "rfc5853", "sbc"],
            summary="Many SBCs learn the remote RTP address from the first packet instead of trusting c=. That is deployment practice, and RFC 5853 is the requirements RFC.",
            objectives=[
                "Describe latching as learning RTP from the first packet",
                "Cite RFC 5853 as requirements, not as an algorithm",
                "Refuse to move the latch toward an unexpected source",
            ],
            illustration={
                "type": "states",
                "title": "c= versus the packet you saw",
                "caption": "Latching is something many SBCs do. RFC 5853 collects requirements. It is not an IETF algorithm.",
                "nodes": ["Read c=", "First RTP", "Latch", "Keep"],
            },
            sections=[
                sec(
                    "Deployment practice, not an algorithm",
                    "Many SBCs learn the remote RTP address from the first packet instead of trusting c=. RFC 5853 is the requirements RFC for SBC deployments, and it is the right citation for why operators ask for this behavior.",
                    "That behavior is deployment practice rather than an IETF algorithm. You will not find a standards-track state machine that says the first packet wins. When you document a design, say what the SBC does and cite RFC 5853 as requirements.",
                    "5853", "8866",
                ),
                sec(
                    "Trust the latch only after signaling",
                    "Latching exists because c= is often an address the SBC cannot send to, which is the embedded-address problem. The first RTP packet shows the address that actually got through the NAT.",
                    "Use latching only for a call whose signaling you already authenticated, and keep the latch on the peer side you expect. If the first packet comes from an unexpected source, treat that as a fault and do not move the media path. ICE, RFC 8445, remains the specified way to choose a candidate pair when both ends implement it.",
                    "5853", "8445", "3261-22",
                ),
            ],
            flow=ladder(
                "First packet, not c=",
                ["Phone", "SBC", "Carrier"],
                [
                    (0, 1, "INVITE", "req", "SDP c= says 203.0.113.10 port 49170. That is the address a strict reader would trust.", invite(ALICE, CUBE, body=latch_offer)),
                    (1, 2, "INVITE", "req", "The SBC places its own media address toward the carrier. The phone's c= line is not forwarded unchanged.", invite(CUBE, CARRIER, body=SDP_OK, branch="z9hG4bKlatch1")),
                    (2, 1, "200", "res", "The carrier answer names 192.0.2.40. Media toward the phone has not been latched yet.", response(200, "OK", CARRIER, extra=[f"Contact: <sip:bob@{CARRIER}>"], body=ANSWER_PTIME)),
                    (0, 1, "RTP", "req", "The first RTP arrives from 203.0.113.20 port 49170, not from the c= address 203.0.113.10. A latching SBC sends return RTP there. This is practice, not an RFC 5853 algorithm.", f"RTP v=2 seq=10 ts=0 ssrc=0x1111\nsource {CUBE}:49170\nSDP c= had said {ALICE}:49170\nSBC return path latched to {CUBE}:49170\n"),
                ],
            ),
            quiz=[
                quiz_item("Media latching means", ["Many SBCs learn the remote RTP address from the first packet instead of trusting c=", "RFC 8445's nominated pair", "Setting the m-line port to 0", "A digest 407"], 0, "Say it is deployment practice. RFC 5853 is the requirements RFC, not an algorithm.", "5853"),
                quiz_item("RFC 5853 is", ["The SBC requirements RFC", "The ICE algorithm", "The STUN Binding method", "The G.711 recommendation"], 0, "Use it when you explain why an SBC offers NAT traversal. Do not cite it as a state machine.", "5853"),
                quiz_item("If c= says 203.0.113.10 and the first RTP comes from 203.0.113.20, a latching SBC", ["Sends return RTP to 203.0.113.20", "Drops the call because ICE failed", "Rewrites the SIP Call-ID", "Converts the stream to telephone-event"], 0, "That is the practice. It is not an IETF algorithm.", "5853"),
                quiz_item("An unexpected first-packet source should", ["Stay a fault. Do not move the latch", "Always win, including sources you did not authenticate", "Replace the TLS certificate", "Clear the digest challenge"], 0, "Latch only for signaling you already accepted, on the side you expect.", "3261-22"),
                quiz_item("When both ends implement candidate checks, the specified mechanism is", ["ICE, RFC 8445", "A SIP ALG", "c=IN IP4 0.0.0.0", "rport alone"], 0, "Latching does not replace ICE where ICE is actually negotiated.", "8445"),
                quiz_item("You document latching as", ["Deployment practice, with RFC 5853 cited as requirements", "An IETF algorithm in RFC 5853", "A payload type", "A Privacy token"], 0, "The requirements RFC explains the operator need. It does not specify the first-packet procedure.", "5853"),
            ],
            cards=[
                card("Latch", "Learn the remote RTP address from the first packet instead of trusting c=.", "5853"),
                card("RFC 5853", "SBC requirements. Not an IETF algorithm for latching.", "5853"),
                card("Authenticated", "Latch only after signaling is accepted, and only toward the expected side.", "3261-22"),
                card("ICE", "RFC 8445 is the specified candidate check when both ends use it.", "8445"),
            ],
            lab=make_lab(
                "Compare c= with the packet source",
                "capture",
                "Extract the INVITE and read c=. Then read the RTP note. The source port's address is not the c= address.",
                ["Press Extract SIP and read c=.", "Read the RTP source in the text.", "State where a latching SBC sends return media."],
                "A latching SBC sends return RTP to",
                ["The source of the first RTP packet", "Always the address in c=, with no exception", "Port 0", "The STUN server only"],
                0,
                "Many SBCs do this. It is deployment practice. RFC 5853 is the requirements RFC, not an algorithm.",
                "5853",
                message=(
                    "Sent:\n"
                    + invite(ALICE, CUBE, body=latch_offer)
                    + "\n"
                    + f"RTP v=2 source {CUBE}:49170\n"
                    + f"SDP c=IN IP4 {ALICE}\n"
                ),
            ),
            fault=make_fault(
                "Latch followed an unexpected source",
                "c= says 203.0.113.10. The first RTP source is 198.51.100.30, which is not the phone side the SBC authenticated. Return media moves there.",
                f"SDP c=IN IP4 {ALICE}\n"
                "m=audio 49170 RTP/AVP 0\n"
                f"first RTP source {CUCM}:49170\n"
                f"authenticated phone side {ALICE}\n"
                f"SBC return path latched to {CUCM}:49170\n",
                ["Do not move the latch to a source that is not the authenticated peer side", "The first packet always wins, whatever the source", "RFC 5853 specifies this state machine", "c= must be deleted"],
                0,
                "Many SBCs learn the remote RTP address from the first packet instead of trusting c=. That is deployment practice. RFC 5853 is the requirements RFC, not an IETF algorithm.",
                "The SBC latched onto a source that was not the signaling peer it had accepted.",
                "Keep return RTP on the authenticated side. If the first packet comes from somewhere else, raise a fault and leave the path. Use ICE when both ends support RFC 8445.",
                "5853", "8445", "3261-22",
            ),
        ),
    ]


def tracks():
    return [sdp_track(), rtp_track(), security_track(), nat_track()]
