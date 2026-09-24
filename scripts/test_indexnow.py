import unittest
from unittest.mock import patch
from urllib.error import HTTPError
import notify_indexnow as indexnow

B = indexnow.BASE
class DiscoveryTests(unittest.TestCase):
    def test_only_canonical_pages_not_redirects_assets_or_query_variants(self):
        current = {B, B+'recruiting.html'}
        self.assertEqual(indexnow.changed_urls(current,current,['index.html','recruiting.html','legacy/index.html','assets/css/discovery.css','recruiting.html?x=1']),[B,B+'recruiting.html'])
    def test_additions_and_removals_are_not_lost(self):
        self.assertEqual(indexnow.changed_urls({B+'new.html'},{B+'old.html'},[]),[B+'new.html',B+'old.html'])
    def test_sitemap_date_edit_does_not_resubmit_all_urls(self):
        current={B,B+'recruiting.html'}
        self.assertEqual(indexnow.changed_urls(current,current,['sitemap.xml']),[])
    def test_transient_http_failure_retries_but_permission_failure_does_not(self):
        with patch.object(indexnow,'urlopen',side_effect=HTTPError(B,503,'Unavailable',{},None)) as request, patch.object(indexnow.time,'sleep'):
            with self.assertRaises(HTTPError): indexnow.request(B)
            self.assertEqual(request.call_count,3)
        with patch.object(indexnow,'urlopen',side_effect=HTTPError(B,403,'Forbidden',{},None)) as request:
            with self.assertRaises(HTTPError): indexnow.request(B)
            self.assertEqual(request.call_count,1)
    def test_dry_run_never_requests_network(self):
        with patch('sys.argv',['notify_indexnow.py','--all']),patch.object(indexnow,'request') as request,patch('builtins.print'):
            self.assertEqual(indexnow.main(),0)
            request.assert_not_called()
    def test_submission_aborts_if_public_key_is_not_deployed(self):
        with patch('sys.argv',['notify_indexnow.py','--all','--submit']),patch.object(indexnow,'request',return_value=(200,b'wrong')) as request,patch('builtins.print'):
            with self.assertRaisesRegex(ValueError,'not deployed'):indexnow.main()
            self.assertEqual(request.call_count,1)
    def test_submission_aborts_if_production_html_differs(self):
        key=__import__('json').loads((indexnow.ROOT/'data/indexnow.json').read_text())['key']
        with patch('sys.argv',['notify_indexnow.py','--all','--submit']),patch.object(indexnow,'request',side_effect=[(200,key.encode()),(200,b'outdated HTML')]) as request,patch('builtins.print'):
            with self.assertRaisesRegex(ValueError,'does not match'):indexnow.main()
            self.assertEqual(request.call_count,2)
if __name__=='__main__':unittest.main()
