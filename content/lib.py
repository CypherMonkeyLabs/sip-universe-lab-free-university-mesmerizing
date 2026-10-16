"""Shared constructors for the SIP Universe curriculum."""

def R(number, section=None, label=None):
    url = f"https://www.rfc-editor.org/rfc/rfc{number}"
    if section:
        url += f"#section-{section}"
    text = label or (f"RFC {number} §{section}" if section else f"RFC {number}")
    return {"label": text, "url": url}


def U(label, url):
    return {"label": label, "url": url}


C = {
    "3261": R(3261),
    "3261-4": R(3261, "4"),
    "3261-7": R(3261, "7"),
    "3261-8": R(3261, "8"),
    "3261-8.1.1.6": R(3261, "8.1.1.6"),
    "3261-8.1.1.7": R(3261, "8.1.1.7"),
    "3261-10": R(3261, "10"),
    "3261-11": R(3261, "11"),
    "3261-12": R(3261, "12"),
    "3261-13": R(3261, "13"),
    "3261-16": R(3261, "16"),
    "3261-17": R(3261, "17"),
    "3261-18": R(3261, "18"),
    "3261-20": R(3261, "20"),
    "3261-21": R(3261, "21"),
    "3261-22": R(3261, "22"),
    "3261-25": R(3261, "25"),
    "3262": R(3262),
    "3263": R(3263),
    "3264": R(3264),
    "3264-6": R(3264, "6"),
    "3311": R(3311),
    "3323": R(3323),
    "3325": R(3325),
    "3326": R(3326),
    "3327": R(3327),
    "3428": R(3428),
    "3515": R(3515),
    "3550": R(3550),
    "3551": R(3551),
    "3581": R(3581),
    "3608": R(3608),
    "3665": R(3665),
    "3711": R(3711),
    "3891": R(3891),
    "3960": R(3960),
    "3966": R(3966),
    "4028": R(4028),
    "4566": R(4566),
    "4568": R(4568),
    "4730": R(4730),
    "4733": R(4733),
    "5411": R(5411),
    "5626": R(5626),
    "5627": R(5627),
    "5737": R(5737),
    "5764": R(5764),
    "5806": R(5806),
    "5853": R(5853),
    "5922": R(5922),
    "5923": R(5923),
    "6026": R(6026),
    "6086": R(6086),
    "6141": R(6141),
    "6337": R(6337),
    "6442": R(6442),
    "6665": R(6665),
    "6716": R(6716),
    "6881": R(6881),
    "7044": R(7044),
    "7092": R(7092),
    "7118": R(7118),
    "7616": R(7616),
    "7865": R(7865),
    "7866": R(7866),
    "8224": R(8224),
    "8225": R(8225),
    "8226": R(8226),
    "8445": R(8445),
    "8489": R(8489),
    "8588": R(8588),
    "8656": R(8656),
    "8866": R(8866),
    "3246": R(3246),
    "4594": R(4594),
    "5031": R(5031),
    "cube-prof": U("Cisco CUBE SIP profiles (IOS XE 17.6+)", "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/voice/cube/ios-xe/config/ios-xe-book/m_voi-sip-param-mod.html"),
    "cube-basic": U("Cisco CUBE basic SIP configuration", "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/voice/cube/ios-xe/config/ios-xe-book/m_voi-sip-basic-config.html"),
    "cube-cases": U("Cisco SIP profile use cases", "https://www.cisco.com/c/en/us/support/docs/unified-communications/unified-border-element/118825-technote-sip-00.html"),
    "cube-csa": U("Cisco Collaboration Solutions Analyzer", "https://www.cisco.com/c/en/us/support/docs/voice/session-initiation-protocol-sip/222316-troubleshoot-cube-via-collaboration-solu.html"),
    "cme-toll": U("Cisco CME toll-fraud prevention", "https://www.cisco.com/c/en/us/td/docs/voice_ip_comm/cucme/admin/configuration/manual/cmeadm/cmetoll.html"),
    "srst-toll": U("Cisco SRST trusted IP authentication", "https://www.cisco.com/c/en/us/td/docs/voice_ip_comm/cusrst/feature/guide/srst8_1.html"),
    "cucm": U("Cisco Unified Communications Manager", "https://www.cisco.com/c/en/us/support/unified-communications/unified-communications-manager-callmanager/series.html"),
    "unity": U("Cisco Unity Connection", "https://www.cisco.com/c/en/us/support/unified-communications/unity-connection/series.html"),
    "uccx": U("Cisco Unified Contact Center Express", "https://www.cisco.com/c/en/us/support/customer-collaboration/unified-contact-center-express/series.html"),
    "cvp": U("Cisco Unified Customer Voice Portal", "https://www.cisco.com/c/en/us/support/customer-collaboration/unified-customer-voice-portal/series.html"),
    "oracle-hmr": U("Oracle SBC HMR fundamentals (10.1)", "https://docs.oracle.com/en/industries/communications/session-border-controller/10.1.0/hmr/hmr-fundamentals.html"),
    "oracle-hmr-cfg": U("Oracle SBC HMR configuration (10.1)", "https://docs.oracle.com/en/industries/communications/session-border-controller/10.1.0/hmr/hmr-configuration.html"),
    "oracle-sbc": U("Oracle Communications SBC documentation", "https://docs.oracle.com/en/industries/communications/session-border-controller/index.html"),
    "audiocodes": U("AudioCodes SIP message manipulation (7.6)", "https://techdocs.audiocodes.com/session-border-controller-sbc/mediant-software-sbc/user-manual/version-760/Content/UM/Configuring%20SIP%20Message%20Manipulation.htm"),
    "audiocodes-syntax": U("AudioCodes manipulation syntax 7.6", "https://www.audiocodes.com/media/aomncwrs/sip-message-manipulation-syntax-reference-guide-ver-76.pdf"),
    "ribbon-edge": U("Ribbon SBC SWe Edge", "https://ribboncommunications.com/products/enterprise-products/session-border-controllers/sbc-software-edition-edge-sbc-swe-edge"),
    "ribbon-docs": U("Ribbon documentation portal", "https://ribboncommunications.com/services/support-services/documentation"),
    "ribbon-iot": U("Ribbon SBC interoperability guides", "https://ribboncommunications.com/partners/interoperability-guides"),
    "teams-plan": U("Plan Direct Routing", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"),
    "teams-rfc": U("Direct Routing definitions and RFCs", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-protocols"),
    "teams-sip": U("Direct Routing SIP protocol", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-protocols-sip"),
    "teams-opts": U("Direct Routing OPTIONS and TLS", "https://learn.microsoft.com/en-us/microsoftteams/troubleshoot/phone-system/direct-routing/sip-options-tls-certificate-issues"),
    "ms-721": U("MS-721 certification", "https://learn.microsoft.com/en-us/credentials/certifications/m365-collaboration-communications-systems-engineer/"),
    "ms-721-guide": U("MS-721 study guide", "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ms-721"),
    "webex-org": U("Configure Webex Calling PSTN", "https://help.webex.com/article/njvdjf2/Configure-Cisco-Webex-Calling-for-Your-Organization"),
    "webex-lgw": U("Get started with Local Gateway", "https://help.webex.com/en-us/article/t9xctu/Get-started-with-Local-Gateway"),
    "webex-ios": U("Local Gateway on IOS XE", "https://help.webex.com/en-us/article/jr1i3r/Configure-local-gateway-on-IOS-XE-for-Webex-Calling"),
    "webex-trunks": U("Webex Calling trunks and dial plans", "https://help.webex.com/article/n0xb944"),
    "ccnp": U("CCNP Collaboration", "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/collaboration/ccnp-collaboration/index.html"),
    "cisco-exams": U("Cisco exams list", "https://www.cisco.com/site/us/en/learn/training-certifications/exams/list.html"),
    "clcor": U("350-801 CLCOR", "https://www.cisco.com/site/us/en/learn/training-certifications/exams/clcor.html"),
    "cisco-era": U("Cisco certification updates", "https://learningnetwork.cisco.com/s/a-new-era-for-cisco-certifications"),
    "ssca": U("SSCA Elite", "https://www.thesipschool.com/ssca.html"),
    "sipschool": U("The SIP School courses", "https://www.thesipschool.com/courses/view"),
    "connect-tel": U("Amazon Connect telephony", "https://docs.aws.amazon.com/connect/latest/adminguide/concepts-telephony.html"),
    "connect-ext": U("Connect external voice system", "https://docs.aws.amazon.com/connect/latest/adminguide/configure-external-voice-system.html"),
    "connect-conn": U("Connect conversational analytics connector", "https://docs.aws.amazon.com/connect/latest/adminguide/create-contact-lens-connector.html"),
    "chime-vc": U("Amazon Chime SDK Voice Connector", "https://docs.aws.amazon.com/chime-sdk/latest/ag/voice-connectors.html"),
    "chime-connect": U("Voice Connector and Connect", "https://docs.aws.amazon.com/chime-sdk/latest/ag/vc-connect-integrations.html"),
    "five9": U("Five9 BYO SIP trunking", "https://documentation.five9.com/bundle/byot-sip-trunk-integration/page/byo-sip-trunking/landing-byo-sip-trunking.htm"),
    "genesys-cloud": U("Genesys BYOC Cloud overview", "https://help.genesys.cloud/articles/byoc-cloud-overview/"),
    "genesys-about": U("About BYOC Cloud", "https://help.genesys.cloud/articles/about-byoc-cloud/"),
    "genesys-prem": U("About BYOC Premises", "https://help.genesys.cloud/articles/about-byoc-premises/"),
    "genesys-hybrid": U("BYOC Cloud with BYOC Premises", "https://help.genesys.cloud/faqs/can-i-use-byoc-cloud-with-byoc-premises/"),
    "cxone": U("NiCE CXone connectivity", "https://help.nicecxone.com/content/globalfeatures/connectivity/connectivityincxone.htm"),
    "cxone-ports": U("NiCE CXone ports", "https://help.nicecxone.com/content/platformrequirements/ports.htm"),
    "twilio": U("Twilio Elastic SIP Trunking", "https://www.twilio.com/docs/sip-trunking"),
    "twilio-ts": U("Twilio trunk troubleshooting", "https://www.twilio.com/docs/sip-trunking/troubleshooting"),
    "twilio-api": U("Twilio Elastic SIP Trunking API", "https://www.twilio.com/docs/sip-trunking/api"),
    "fcc-stir": U("FCC call authentication", "https://www.fcc.gov/call-authentication"),
    "fcc-mlts": U("FCC MLTS 911 requirements", "https://www.fcc.gov/mlts-911-requirements"),
    "ws-sip": U("Wireshark SIP display filter reference", "https://www.wireshark.org/docs/dfref/s/sip.html"),
    "ws-rtp": U("Wireshark RTP display filter reference", "https://www.wireshark.org/docs/dfref/r/rtp.html"),
    "opus": U("Opus license", "https://www.opus-codec.org/license/"),
    "ietf-ipr": U("IETF IPR disclosures", "https://datatracker.ietf.org/ipr/"),
    "ietf-tlp": U("IETF Trust Legal Provisions", "https://trustee.ietf.org/trust-legal-provisions.html"),
    "g711": U("ITU-T G.711", "https://www.itu.int/rec/T-REC-G.711"),
    "g729": U("ITU-T G.729", "https://www.itu.int/rec/T-REC-G.729"),
    "6455": R(6455),
    "5124": R(5124),
    "7587": R(7587),
    "7874": R(7874),
    "8825": R(8825),
    "8827": R(8827),
    "8829": R(8829),
    "8834": R(8834),
    "8839": R(8839),
    "asterisk-pjsip": U("Asterisk res_pjsip configuration", "https://docs.asterisk.org/Configuration/Channel-Drivers/SIP/Configuring-res_pjsip/"),
    "asterisk-history": U("A brief history of the Asterisk project", "https://docs.asterisk.org/About-the-Project/A-Brief-History-of-the-Asterisk-Project/"),
    "asterisk-license": U("Asterisk license information", "https://docs.asterisk.org/About-the-Project/License-Information/"),
    "kamailio": U("Kamailio SIP server", "https://www.kamailio.org/w/"),
    "freeswitch": U("FreeSWITCH users manual", "https://developer.signalwire.com/freeswitch/FreeSWITCH-Explained/Introduction/What-is-FreeSWITCH/"),
    "rtpengine": U("rtpengine README", "https://raw.githubusercontent.com/sipwise/rtpengine/master/README.md"),
    "kari-law": U("Kari's Law Act of 2017, Public Law 115-127", "https://www.govinfo.gov/content/pkg/PLAW-115publ127/html/PLAW-115publ127.htm"),
    "ray-baum": U("Public Law 115-141, RAY BAUM'S Act of 2018", "https://www.govinfo.gov/content/pkg/PLAW-115publ141/html/PLAW-115publ141.htm"),
    "sti-ga": U("Secure Telephone Identity Governance Authority", "https://www.atis.org/sti-ga/"),
    "tcr": U("The Campaign Registry", "https://www.campaignregistry.com/"),
    "twilio-docs": U("Twilio docs", "https://www.twilio.com/docs"),
}

ALICE = "203.0.113.10"
CUBE = "203.0.113.20"
CUCM = "198.51.100.30"
CARRIER = "192.0.2.40"


def sip(start, headers, body=""):
    payload = body
    if payload and not payload.endswith("\n"):
        payload += "\n"
    length = len(payload.replace("\n", "\r\n").encode()) if payload else 0
    lines = [start, *headers, f"Content-Length: {length}", "", payload]
    return "\n".join(lines).rstrip() + "\n"


def invite(src, dst_host, number="+15551212", extra=None, body=None, branch="z9hG4bK7766as01", cseq=1, transport="UDP"):
    headers = [
        f"Via: SIP/2.0/{transport} {src};branch={branch}",
        "Max-Forwards: 70",
        f"From: \"Alice\" <sip:alice@example.com>;tag=9fxced76sl",
        f"To: <sip:{number}@example.com>",
        "Call-ID: a84b4c76e66710@example.com",
        f"CSeq: {cseq} INVITE",
        f"Contact: <sip:alice@{src}>",
        "Supported: 100rel,replaces,timer",
        "Allow: INVITE,ACK,CANCEL,BYE,UPDATE,PRACK,OPTIONS,REFER",
    ]
    if body:
        headers.append("Content-Type: application/sdp")
    if extra:
        headers.extend(extra)
    sdp = body if body is not None else (
        "v=0\n"
        f"o=alice 2890844526 2890844526 IN IP4 {src}\n"
        "s=-\n"
        f"c=IN IP4 {src}\n"
        "t=0 0\n"
        "m=audio 49170 RTP/AVP 0 101\n"
        "a=rtpmap:0 PCMU/8000\n"
        "a=rtpmap:101 telephone-event/8000\n"
        "a=fmtp:101 0-16\n"
        "a=ptime:20\n"
        "a=sendrecv\n"
    )
    return sip(f"INVITE sip:{number}@{dst_host} SIP/2.0", headers, sdp if body != "" else "")


def response(code, reason, src, extra=None, body="", cseq="1 INVITE", to_tag="314159", via_host=ALICE):
    headers = [
        f"Via: SIP/2.0/UDP {via_host};branch=z9hG4bK7766as01",
        "From: \"Alice\" <sip:alice@example.com>;tag=9fxced76sl",
        f"To: <sip:+15551212@example.com>;tag={to_tag}",
        "Call-ID: a84b4c76e66710@example.com",
        f"CSeq: {cseq}",
    ]
    if body:
        headers.append("Content-Type: application/sdp")
    if extra:
        headers.extend(extra)
    return sip(f"SIP/2.0 {code} {reason}", headers, body)


SDP_OK = (
    "v=0\n"
    f"o=cube 10 10 IN IP4 {CUBE}\n"
    "s=-\n"
    f"c=IN IP4 {CUBE}\n"
    "t=0 0\n"
    "m=audio 19642 RTP/AVP 0 101\n"
    "a=rtpmap:0 PCMU/8000\n"
    "a=rtpmap:101 telephone-event/8000\n"
    "a=fmtp:101 0-16\n"
    "a=ptime:20\n"
    "a=sendrecv\n"
)


def flow(title, parties, steps):
    return {"title": title, "parties": parties, "steps": steps}


def hop(frm, to, label, kind, note, message):
    return {"from": frm, "to": to, "label": label, "kind": kind, "note": note, "message": message}


def basic_flow(title, notes):
    parties = ["Alice", "SBC", "Bob"]
    steps = [
        hop(0, 1, "INVITE", "req", notes[0], invite(ALICE, CUBE)),
        hop(1, 0, "100", "res", notes[1], response(100, "Trying", CUBE, to_tag="")),
        hop(1, 2, "INVITE", "req", notes[2], invite(CUBE, CARRIER, branch="z9hG4bK7766as02")),
        hop(2, 1, "180", "res", notes[3], response(180, "Ringing", CARRIER, extra=["Contact: <sip:bob@192.0.2.40>"])),
        hop(1, 0, "180", "res", notes[4], response(180, "Ringing", CUBE, extra=["Contact: <sip:bob@203.0.113.20>"])),
        hop(2, 1, "200", "res", notes[5], response(200, "OK", CARRIER, extra=["Contact: <sip:bob@192.0.2.40>"], body=SDP_OK)),
        hop(1, 0, "200", "res", notes[6], response(200, "OK", CUBE, extra=["Contact: <sip:bob@203.0.113.20>"], body=SDP_OK)),
        hop(0, 1, "ACK", "req", notes[7], sip(
            f"ACK sip:bob@{CUBE} SIP/2.0",
            [
                f"Via: SIP/2.0/UDP {ALICE};branch=z9hG4bK7766ack",
                "Max-Forwards: 70",
                "From: \"Alice\" <sip:alice@example.com>;tag=9fxced76sl",
                "To: <sip:+15551212@example.com>;tag=314159",
                "Call-ID: a84b4c76e66710@example.com",
                "CSeq: 1 ACK",
                f"Contact: <sip:alice@{ALICE}>",
            ],
        )),
    ]
    return flow(title, parties, steps)


def cites(*keys):
    return [C[key] if isinstance(key, str) else key for key in keys]


def quiz_item(q, choices, answer, why, cite):
    return {"q": q, "choices": choices, "answer": answer, "why": why, "cite": C[cite] if isinstance(cite, str) else cite}


def card(front, back, cite):
    return {"front": front, "back": back, "cite": C[cite] if isinstance(cite, str) else cite}


def lesson(track_level, **item):
    item.setdefault("level", track_level)
    item.setdefault("minutes", 12)
    item.setdefault("tags", [])
    return item


def check(q, choices, answer, why, cite):
    return {"q": q, "choices": choices, "answer": answer, "why": why, "cite": C[cite] if isinstance(cite, str) else cite}
