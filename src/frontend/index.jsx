import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  Box,
  Button,
  ButtonGroup,
  Heading,
  Link,
  Lozenge,
  SectionMessage,
  Spinner,
  Stack,
  Text,
  useProductContext
} from '@forge/react';
import { invoke } from '@forge/bridge';

const STATE_APPEARANCE = {
  PRESENT: 'success',
  READY: 'success',
  MISSING: 'warning',
  EXPIRED: 'warning',
  CONFLICT: 'danger',
  UNKNOWN: 'discovery'
};

function formatTime(value) {
  if (!value) return 'unknown';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function CheckRow({ check }) {
  return (
    <Box key={check.type}>
      <Stack>
        <Text>
          <Lozenge appearance={STATE_APPEARANCE[check.state] || 'default'}>{check.state}</Lozenge>
          {'  '}
          <Text weight="bold">{check.label}</Text>
        </Text>
        <Text size="small">
          {check.actor ? `Source: ${check.actor}` : 'No source recorded'}
          {check.occurredAt ? ` · ${formatTime(check.occurredAt)}` : ''}
        </Text>
      </Stack>
    </Box>
  );
}

function EvidenceRow({ item }) {
  return (
    <Box key={item.id}>
      <Stack>
        <Text weight="bold">{item.eventType.replaceAll('_', ' ')}</Text>
        <Text size="small">
          {item.status} · {item.actor} · {formatTime(item.occurredAt)}
        </Text>
        {item.details ? <Text size="small">{item.details}</Text> : null}
        {item.sourceUrl ? <Link href={item.sourceUrl}>View evidence source</Link> : null}
      </Stack>
    </Box>
  );
}

const App = () => {
  const context = useProductContext();
  const [chain, setChain] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (key) => {
    if (!key) return;
    setBusy(true);
    setError('');
    try {
      const result = await invoke('getChain', { issueKey: key });
      if (!result.ok) throw new Error(result.error || 'Unable to load evidence');
      setChain(result);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const issueKey = String(
    context?.extension?.issue?.key ||
    context?.extension?.issueKey ||
    context?.issueKey ||
    ''
  ).toUpperCase();

  useEffect(() => {
    if (issueKey) refresh(issueKey);
  }, [issueKey, refresh]);

  const runAction = async (name, payload = {}) => {
    setBusy(true);
    setError('');
    try {
      const result = await invoke(name, { issueKey, ...payload });
      if (!result.ok) throw new Error(result.error || 'Action failed');
      setChain(result.chain || result);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const gate = chain?.gate;

  return (
    <Stack>
      <Heading size="large">Verification Graph</Heading>
      <Text size="small">
        Auditable delivery evidence for {issueKey || 'this issue'}
      </Text>

      {error ? (
        <SectionMessage appearance="error" title="Something went wrong">
          <Text>{error}</Text>
        </SectionMessage>
      ) : null}

      {busy && !chain ? <Spinner size="medium" label="Loading evidence" /> : null}

      {gate ? (
        <Stack>
          <SectionMessage
            appearance={STATE_APPEARANCE[gate.status] || 'information'}
            title={`Release gate: ${gate.status}`}
          >
            <Text>{gate.summary}</Text>
          </SectionMessage>

          <Heading size="small">Required checks</Heading>
          {gate.checks.map((check) => <CheckRow key={check.type} check={check} />)}

          <Heading size="small">Evidence timeline ({chain.evidence.length})</Heading>
          {chain.evidence.length === 0 ? (
            <Text>No evidence has been recorded yet. Load the demo chain or send a signed webhook.</Text>
          ) : chain.evidence.map((item) => <EvidenceRow key={item.id} item={item} />)}

          <Heading size="small">Try it</Heading>
          <ButtonGroup>
            <Button onClick={() => runAction('seedDemo')} isDisabled={busy}>
              Load demo evidence
            </Button>
            <Button onClick={() => runAction('recordApproval', { note: 'Approved in issue panel' })} isDisabled={busy}>
              Approve release
            </Button>
            <Button onClick={() => runAction('simulateFailure')} isDisabled={busy}>
              Simulate failed test
            </Button>
            <Button onClick={() => runAction('resetDemo')} isDisabled={busy}>
              Reset
            </Button>
          </ButtonGroup>

          <Text size="small">
            Ask Rovo “Why can this release ship?” to use the same evidence through the
            Release Evidence Analyst agent, skill, actions, and MCP tools.
          </Text>
        </Stack>
      ) : null}

      {!busy && !chain && !error ? (
        <Stack>
          <Text>The verification chain is empty.</Text>
          <Button onClick={() => runAction('seedDemo')}>Load demo evidence</Button>
        </Stack>
      ) : null}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
